import { json, Router } from "express";
import { UserRequest, verifySession } from "../middleware/verifySession";
import { prisma } from "../db/client";
import { z } from "zod";
import { generateSecureId } from "../actions/generateId";


const router = Router();


router.post('/create', verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const user = await prisma.user.findUnique({
            where: {
                userId
            }
        });

        console.log(1)

        if(!user){
            return res.status(400).json({success: false, message: "Invalid auth"})
        }
        const validateAmount = z.object({
            amount: z.number().min(200, {message: "Minimum amount is 200"})
        }).safeParse(req.body);

        if(!validateAmount.success){
            return res.status(400).json({success: false, message: validateAmount.error.issues[0].message})
        }

        const wallet = await prisma.wallet.findUnique({
            where: {
                userId
            },
            select: {
                balance: true,
                walletId: true
            }
        });

        if(!wallet){
            return res.status(400).json({success: false, message: "Wallet not found"})
        }

        const amount = validateAmount.data.amount;
        if(wallet.balance < amount){
            return res.status(400).json({success: false, message: "Insufficient balance"})
        }

        await prisma.$transaction(async(tx) => {
            await tx.wallet.update({
                where: {
                    walletId: wallet.walletId
                },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            });

            const paymentId = `order_${generateSecureId()}`

            await tx.payment.create({
                data: {
                    paymentId,
                    userId,
                    amount,
                    paymentType: "WITHDRAW"
                }
            });
        })
        return res.status(200).json({success: true, message: "Withdraw request created"})
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})


export default router