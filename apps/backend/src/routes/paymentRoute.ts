import { Router } from "express";
import dotenv from 'dotenv'
import razorpay from 'razorpay'
import { UserRequest, verifySession } from "../middleware/verifySession";
import { createPaymentSchema, verifyPaymentSchema } from "../zod/PaymentValidator";
import { prisma } from "../db/client";
import { verifySignature } from "../actions/verifySignature";

dotenv.config()


const router = Router();

const razr_key = process.env.RAZORPAY_KEY
const razr_secret = process.env.RAZORPAY_SECRET

const rz = new razorpay({
    key_id: razr_key,
    key_secret: razr_secret
})




router.post('/create', verifySession,async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const isValidCreate = createPaymentSchema.safeParse(req.body);

        if(!isValidCreate.success){
            return res.status(400).json({success: false, message: isValidCreate.error.issues[0].message})
        }

        const amount = isValidCreate.data.amount

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt#1",
            payment_capture: 1
        }

        const order = await rz.orders.create(options);

        await prisma.payment.create({
            data: {
                paymentId: order.id,
                userId,
                amount,
                paymentType: "DEPOSIT"
            }
        })

        res.status(200).json({success: true, message: "Order created", orderId: order.id, amount: order.amount, currency: order.currency})

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})


  router.post('/verify', verifySession, async (req: UserRequest, res) => {

    try {
        const isValidUpdate = verifyPaymentSchema.safeParse(req.body);
        if (!isValidUpdate.success) {
            return res.status(400).json({ message: isValidUpdate.error.message });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = isValidUpdate.data;

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    


        const response = await prisma.$transaction(async(tx) => {

            const transaction = await tx.payment.findUnique({
              where: { paymentId: razorpay_order_id },
              select: { userId: true, amount: true }
            });
            
            if (!transaction) {
              return res.status(400).json({ message: 'Transaction not found' });
            }

            if(transaction.userId !== req.userId){
                return res.status(400).json({success: false, message: "Unauthorized Payment"})
            }

            await tx.payment.update({
              where: { paymentId: razorpay_order_id },
              data: {
                paymentStatus: isValid ? "Success" : "Failed",
              },
            });
            if (!isValid) {
                return res.status(400).json({ message: 'Invalid signature. Payment verification failed' });
            }
            const user = await tx.user.findUnique({
              where: { userId: transaction.userId },
              select: {wallet: {select: {walletId: true}}}
            });
            
            if(!user){
              return res.status(400).json({ message: 'User not found' });
            }
    
            if(!user.wallet){
              return res.status(400).json({ message: 'Wallet not found' });
            }
    
            const updatedTransaction = await tx.wallet.update({
                    where: {
                      walletId: user.wallet.walletId
                    },
                    data: {
                      balance: {
                        increment: transaction.amount
                      }
                    }
                })
            return res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
        })
  
        return response

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error", error})
    }
});




router.get('/fetchpayments', verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId!;
        const payments = await prisma.payment.findMany({
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
        })
        res.status(200).json({success: true, message: "Payments fetched", payments})
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})

export default router