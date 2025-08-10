"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv_1 = __importDefault(require("dotenv"));
const razorpay_1 = __importDefault(require("razorpay"));
const verifySession_1 = require("../middleware/verifySession");
const PaymentValidator_1 = require("../zod/PaymentValidator");
const client_1 = require("../db/client");
const verifySignature_1 = require("../actions/verifySignature");
dotenv_1.default.config();
const router = (0, express_1.Router)();
const razr_key = process.env.RAZORPAY_KEY;
const razr_secret = process.env.RAZORPAY_SECRET;
const rz = new razorpay_1.default({
    key_id: razr_key,
    key_secret: razr_secret
});
router.post('/create', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const isValidCreate = PaymentValidator_1.createPaymentSchema.safeParse(req.body);
        if (!isValidCreate.success) {
            return res.status(400).json({ success: false, message: isValidCreate.error.issues[0].message });
        }
        const amount = isValidCreate.data.amount;
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt#1",
            payment_capture: 1
        };
        const order = yield rz.orders.create(options);
        yield client_1.prisma.payment.create({
            data: {
                paymentId: order.id,
                userId,
                amount,
                paymentType: "DEPOSIT"
            }
        });
        res.status(200).json({ success: true, message: "Order created", orderId: order.id, amount: order.amount, currency: order.currency });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
router.post('/verify', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValidUpdate = PaymentValidator_1.verifyPaymentSchema.safeParse(req.body);
        if (!isValidUpdate.success) {
            return res.status(400).json({ message: isValidUpdate.error.message });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = isValidUpdate.data;
        const isValid = (0, verifySignature_1.verifySignature)(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        const response = yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = yield tx.payment.findUnique({
                where: { paymentId: razorpay_order_id },
                select: { userId: true, amount: true }
            });
            if (!transaction) {
                return res.status(400).json({ message: 'Transaction not found' });
            }
            if (transaction.userId !== req.userId) {
                return res.status(400).json({ success: false, message: "Unauthorized Payment" });
            }
            yield tx.payment.update({
                where: { paymentId: razorpay_order_id },
                data: {
                    paymentStatus: isValid ? "Success" : "Failed",
                },
            });
            if (!isValid) {
                return res.status(400).json({ message: 'Invalid signature. Payment verification failed' });
            }
            const user = yield tx.user.findUnique({
                where: { userId: transaction.userId },
                select: { wallet: { select: { walletId: true } } }
            });
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }
            if (!user.wallet) {
                return res.status(400).json({ message: 'Wallet not found' });
            }
            const updatedTransaction = yield tx.wallet.update({
                where: {
                    walletId: user.wallet.walletId
                },
                data: {
                    balance: {
                        increment: transaction.amount
                    }
                }
            });
            return res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
        }));
        return response;
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}));
router.get('/fetchpayments', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const payments = yield client_1.prisma.payment.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                paymentId: true,
                amount: true,
                paymentStatus: true,
                createdAt: true,
                paymentType: true
            }
        });
        res.status(200).json({ success: true, message: "Payments fetched", payments });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
