"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const razr_secret = process.env.RAZORPAY_SECRET;
const verifySignature = (orderId, paymentId, signature) => {
    const generatedSignature = crypto_1.default
        .createHmac('sha256', razr_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(generatedSignature, 'hex'), Buffer.from(signature, 'hex'));
};
exports.verifySignature = verifySignature;
