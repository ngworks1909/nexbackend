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
const client_1 = require("../../db/client");
const router_1 = __importDefault(require("../../router/router"));
const UserValidator_1 = require("../../zod/UserValidator");
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}
router_1.default.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("This is signup");
        const isValidSignup = UserValidator_1.signupValidator.safeParse(req.body);
        if (!isValidSignup.success) {
            return res.status(400).json({
                success: false,
                message: isValidSignup.error.errors[0]
            });
        }
        const { username, mobile } = isValidSignup.data;
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
        const otp = generateOtp().toString();
        yield client_1.prisma.user.create({
            data: {
                username,
                mobile,
                otp
            }
        });
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
