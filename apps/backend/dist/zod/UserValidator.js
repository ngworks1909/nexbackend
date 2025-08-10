"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralValidator = exports.otpValidator = exports.updateValidator = exports.signupValidator = exports.loginValidator = void 0;
const zod_1 = require("zod");
const mobileSchema = zod_1.z.string().regex(/^[6-9]\d{9}$/, // Regex for valid Indian mobile numbers
{
    message: "Not a valid mobile number.",
});
exports.loginValidator = zod_1.z.object({
    mobile: mobileSchema
});
exports.signupValidator = zod_1.z.object({
    mobile: mobileSchema,
    username: zod_1.z.string().min(3, {
        message: "Username must be 3 characters long."
    }),
});
exports.updateValidator = zod_1.z.object({
    username: zod_1.z.string().min(3, {
        message: "Username must be 3 characters long."
    })
});
exports.otpValidator = zod_1.z.object({
    mobile: mobileSchema,
    otp: zod_1.z.string().min(6, {
        message: "OTP must be 6 characters long."
    })
});
exports.referralValidator = zod_1.z.object({
    referralCode: zod_1.z.string().length(6, { message: "Invalid referral code." })
});
