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
const client_1 = require("../../db/client");
const router_1 = __importDefault(require("../../router/router"));
const UserValidator_1 = require("../../zod/UserValidator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
router_1.default.post("/verifyotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const isValidOtp = UserValidator_1.otpValidator.safeParse(req.body);
        if (!isValidOtp.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data.'
            });
        }
        const { mobile, otp } = isValidOtp.data;
        const user = yield client_1.prisma.user.findUnique({
            where: {
                mobile
            },
            select: {
                otp: true,
                userId: true
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
        const data = {
            user: {
                userId: user.userId
            }
        };
        const authToken = jsonwebtoken_1.default.sign(data, `${(_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'secret'}`);
        return res.status(200).json({
            success: true,
            message: 'OTP verified.',
            authToken
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
}));
