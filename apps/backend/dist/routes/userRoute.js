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
exports.generateOtp = generateOtp;
exports.generateReferralCode = generateReferralCode;
const express_1 = require("express");
const UserValidator_1 = require("../zod/UserValidator");
const client_1 = require("../db/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifySession_1 = require("../middleware/verifySession");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
function generateOtp() {
    return (0, crypto_1.randomInt)(100000, 1000000);
}
function getRandomUppercaseLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[(0, crypto_1.randomInt)(0, alphabet.length)];
}
function getRandomDigit() {
    return (0, crypto_1.randomInt)(0, 10).toString();
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = (0, crypto_1.randomInt)(0, i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function generateReferralCode() {
    const chars = [];
    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
        chars.push(getRandomUppercaseLetter());
    }
    // Add 3 random digits
    for (let i = 0; i < 3; i++) {
        chars.push(getRandomDigit());
    }
    // Shuffle to randomize order
    return shuffleArray(chars).join('');
}
// signup route
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValidSignup = UserValidator_1.signupValidator.safeParse(req.body);
        if (!isValidSignup.success) {
            return res.status(400).json({
                success: false,
                message: isValidSignup.error.errors[0].message
            });
        }
        const { username, mobile, referralCode } = isValidSignup.data;
        const existingUser = yield client_1.prisma.user.findUnique({
            where: {
                mobile
            }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }
        var referralId = null;
        if (referralCode) {
            const referrer = yield client_1.prisma.user.findUnique({
                where: {
                    referralCode
                },
                select: {
                    userId: true,
                    verified: true
                }
            });
            if (!referrer) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid referral code."
                });
            }
            if (!referrer.verified) {
                return res.status(400).json({
                    success: false,
                    message: "Referrer is not verified."
                });
            }
            referralId = referrer.userId;
        }
        const otp = generateOtp().toString();
        yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.create({
                data: {
                    username,
                    mobile,
                    otp,
                    referredBy: referralId
                },
                select: {
                    userId: true
                }
            });
            yield tx.wallet.create({
                data: {
                    userId: user.userId,
                }
            });
        }));
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully.",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
//login route
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValidLogin = UserValidator_1.loginValidator.safeParse(req.body);
        if (!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            });
        }
        const { mobile } = isValidLogin.data;
        const existingUser = yield client_1.prisma.user.findUnique({
            where: {
                mobile
            }
        });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist."
            });
        }
        const otp = generateOtp().toString();
        yield client_1.prisma.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
//verifyotp route
router.post("/verifyotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const isValidOtp = UserValidator_1.otpValidator.safeParse(req.body);
        if (!isValidOtp.success) {
            return res.status(400).json({
                success: false,
                message: isValidOtp.error.errors[0].message
            });
        }
        const { mobile, otp } = isValidOtp.data;
        const user = yield client_1.prisma.user.findUnique({
            where: {
                mobile
            },
            select: {
                otp: true,
                userId: true,
                username: true,
                mobile: true,
                createdAt: true,
                verified: true,
                referredBy: true,
                referralCode: true
            }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist.'
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.'
            });
        }
        var referralCode = user.referralCode;
        if (!user.verified) {
            referralCode = generateReferralCode();
            yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                yield tx.user.update({
                    where: {
                        mobile
                    },
                    data: {
                        verified: true,
                        referralCode
                    }
                });
                if (user.referredBy) {
                    const referrer = yield tx.user.findUnique({
                        where: {
                            userId: user.referredBy
                        },
                        select: {
                            wallet: {
                                select: {
                                    walletId: true
                                }
                            }
                        }
                    });
                    if (referrer && referrer.wallet) {
                        yield tx.wallet.update({
                            where: {
                                walletId: referrer.wallet.walletId
                            },
                            data: {
                                balance: {
                                    increment: 100
                                }
                            }
                        });
                    }
                }
            }));
        }
        const data = {
            user: {
                userId: user.userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: referralCode
            }
        };
        const authToken = jsonwebtoken_1.default.sign(data, `${(_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'secret'}`, { expiresIn: '15d' });
        const refreshToken = jsonwebtoken_1.default.sign(data, `${(_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : 'secret'}`, { expiresIn: '20d' });
        return res.status(200).json({
            success: true,
            message: 'OTP verified.',
            authToken,
            refreshToken
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}));
//resend otp route
router.post("/resendotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValidLogin = UserValidator_1.loginValidator.safeParse(req.body);
        if (!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            });
        }
        const { mobile } = isValidLogin.data;
        const existingUser = yield client_1.prisma.user.findUnique({
            where: {
                mobile
            }
        });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist."
            });
        }
        const otp = generateOtp().toString();
        yield client_1.prisma.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
router.put('/update', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.userId;
        const user = yield client_1.prisma.user.findUnique({
            where: {
                userId
            }, select: {
                mobile: true,
                createdAt: true,
                referralCode: true
            }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid auth" });
        }
        const isValidUpdate = UserValidator_1.updateValidator.safeParse(req.body);
        if (!isValidUpdate.success) {
            return res.status(400).json({
                success: false,
                message: isValidUpdate.error.errors[0].message
            });
        }
        const { username } = isValidUpdate.data;
        yield client_1.prisma.user.update({
            where: {
                userId
            },
            data: {
                username
            }
        });
        const data = {
            user: {
                userId: userId,
                username: username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        };
        const authToken = jsonwebtoken_1.default.sign(data, `${(_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'secret'}`, { expiresIn: '15d' });
        const refreshToken = jsonwebtoken_1.default.sign(data, `${(_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : 'secret'}`, { expiresIn: '20d' });
        return res.status(200).json({
            success: true,
            message: "User updated",
            authToken,
            refreshToken
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
router.get('/refresh', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.userId;
        const user = yield client_1.prisma.user.findUnique({
            where: {
                userId
            },
            select: {
                username: true,
                referralCode: true,
                mobile: true,
                createdAt: true,
            }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid auth" });
        }
        const data = {
            user: {
                userId: userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        };
        const authToken = jsonwebtoken_1.default.sign(data, `${(_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'secret'}`, { expiresIn: '15d' });
        const refreshToken = jsonwebtoken_1.default.sign(data, `${(_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : 'secret'}`, { expiresIn: '20d' });
        return res.status(200).json({
            success: true,
            message: "Token refreshed",
            authToken,
            refreshToken
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
