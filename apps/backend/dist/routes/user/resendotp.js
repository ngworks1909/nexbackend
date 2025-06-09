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
const signup_1 = require("./signup");
router_1.default.post("/resendotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValidLogin = UserValidator_1.loginValidator.safeParse(req.body);
        if (!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0]
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
        const otp = (0, signup_1.generateOtp)().toString();
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
