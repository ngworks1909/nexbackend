import { z } from "zod";

export const createPaymentSchema = z.object({
    amount: z.number().min(50, {message: "Amount must be greater than 10"}),
})

export const verifyPaymentSchema = z.object({
    razorpay_payment_id: z.string(),
    razorpay_order_id: z.string(),
    razorpay_signature: z.string(),
})