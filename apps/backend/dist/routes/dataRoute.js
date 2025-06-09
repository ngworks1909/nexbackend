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
const router = (0, express_1.Router)();
router.get("/fetchdata", verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const wallet = yield client_1.prisma.wallet.findUnique({
            where: {
                userId
            },
            select: {
                balance: true
            }
        });
        if (!wallet) {
            return res.status(400).json({ success: false, message: "Wallet not found" });
        }
        const games = yield client_1.prisma.game.findMany({
            where: {
                isActive: true
            },
            select: {
                gameId: true,
                gameName: true,
                entryFee: true,
                winAmount: true,
                maxPlayers: true
            }
        });
        return res.status(200).json({ success: true, wallet, games });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
router.get('/activity', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const data = yield client_1.prisma.user.findUnique({
            where: {
                userId
            },
            select: {
                rooms: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 10,
                    select: {
                        game: {
                            select: {
                                entryFee: true,
                                maxPlayers: true,
                                gameName: true
                            }
                        },
                        winAmount: true,
                        createdAt: true,
                        winnerId: true
                    }
                }
            },
        });
        if (!data) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, rooms: data.rooms, message: "Rooms fetched" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
