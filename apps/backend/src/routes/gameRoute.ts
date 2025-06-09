import { Router } from "express";
import { UserRequest, verifySession } from "../middleware/verifySession";
import { prisma } from "../db/client";
import { createGameTokenSchema } from "../zod/GameValidator";
import { warnEnvConflicts } from "@prisma/client/runtime/library";
import { generateGameToken } from "../actions/generateGameToken";

const router = Router();

router.post('/create', verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId
        if(!userId){
            return res.status(400).json({success: false, message: "Invalid auth"})
        }
        const isValidGame = createGameTokenSchema.safeParse(req.body);
        if(!isValidGame.success){
            return res.status(400).json({success: false, message: isValidGame.error.issues[0].message})
        }
        const gameId = isValidGame.data.gameId
        const game = await prisma.game.findUnique({
            where: {
                gameId
            }
        });

        if(!game){
            return res.status(400).json({success: false, message: "Game not found"})
        }

        const user = await prisma.user.findUnique({
            where: {
                userId
            },
            select: {
                wallet: {
                    select: {
                        balance: true,
                        walletId : true
                    }
                }
            }
        })

        if(!user){
            return res.status(400).json({success: false, message: "Authorization failed"})
        }

        if(!user.wallet){
            return res.status(400).json({success: false, message: "Wallet not found"})
        }


        if(user.wallet.balance <= game.entryFee){
            return res.status(400).json({success: false, message: "Insufficient balance"})
        }
        await prisma.wallet.update({
            where: {
                walletId: user.wallet.walletId
            },
            data: {
                balance: {
                    decrement: game.entryFee
                }
            }
        })
        const seed = generateGameToken(gameId)
        return res.status(200).json({success: true, message: "Game created", seed})
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})


export default router