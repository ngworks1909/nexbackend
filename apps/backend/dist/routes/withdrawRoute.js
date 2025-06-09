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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifySession_1 = require("../middleware/verifySession");
const client_1 = require("../db/client");
const zod_1 = require("zod");
const generateId_1 = require("../actions/generateId");
const router = (0, express_1.Router)();
router.post('/create', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield client_1.prisma.user.findUnique({
            where: {
                userId
            }
        });
        console.log(1);
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid auth" });
        }
        const validateAmount = zod_1.z.object({
            amount: zod_1.z.number().min(200, { message: "Minimum amount is 200" })
        }).safeParse(req.body);
        if (!validateAmount.success) {
            return res.status(400).json({ success: false, message: validateAmount.error.issues[0].message });
        }
        const wallet = yield client_1.prisma.wallet.findUnique({
            where: {
                userId
            },
            select: {
                balance: true,
                walletId: true
            }
        });
        if (!wallet) {
            return res.status(400).json({ success: false, message: "Wallet not found" });
        }
        const amount = validateAmount.data.amount;
        if (wallet.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.wallet.update({
                where: {
                    walletId: wallet.walletId
                },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            });
            const paymentId = `order_${(0, generateId_1.generateSecureId)()}`;
            yield tx.payment.create({
                data: {
                    paymentId,
                    userId,
                    amount,
                    paymentType: "WITHDRAW"
                }
            });
        }));
        return res.status(200).json({ success: true, message: "Withdraw request created" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
