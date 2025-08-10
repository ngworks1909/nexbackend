"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().min(50, { message: "Amount must be greater than 10" }),
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpay_payment_id: zod_1.z.string(),
    razorpay_order_id: zod_1.z.string(),
    razorpay_signature: zod_1.z.string(),
});
