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
const GameValidator_1 = require("../zod/GameValidator");
const generateGameToken_1 = require("../actions/generateGameToken");
const router = (0, express_1.Router)();
router.post('/create', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Invalid auth" });
        }
        const isValidGame = GameValidator_1.createGameTokenSchema.safeParse(req.body);
        if (!isValidGame.success) {
            return res.status(400).json({ success: false, message: isValidGame.error.issues[0].message });
        }
        const gameId = isValidGame.data.gameId;
        const game = yield client_1.prisma.game.findUnique({
            where: {
                gameId
            }
        });
        if (!game) {
            return res.status(400).json({ success: false, message: "Game not found" });
        }
        const user = yield client_1.prisma.user.findUnique({
            where: {
                userId
            },
            select: {
                wallet: {
                    select: {
                        balance: true,
                        walletId: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Authorization failed" });
        }
        if (!user.wallet) {
            return res.status(400).json({ success: false, message: "Wallet not found" });
        }
        if (user.wallet.balance <= game.entryFee) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        yield client_1.prisma.wallet.update({
            where: {
                walletId: user.wallet.walletId
            },
            data: {
                balance: {
                    decrement: game.entryFee
                }
            }
        });
        const seed = (0, generateGameToken_1.generateGameToken)(gameId);
        return res.status(200).json({ success: true, message: "Game created", seed });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
