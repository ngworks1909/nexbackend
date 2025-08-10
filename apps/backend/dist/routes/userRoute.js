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
/**
 * Generates a 6-digit numeric OTP.
 *
 * @returns {number} A random integer between 100000 and 999999 inclusive.
 */
function generateOtp() {
    return (0, crypto_1.randomInt)(100000, 1000000); // upper bound is exclusive in randomInt
}
/**
 * Returns a random uppercase English letter (A-Z).
 *
 * @returns {string} A single uppercase letter.
 */
function getRandomUppercaseLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[(0, crypto_1.randomInt)(0, alphabet.length)];
}
/**
 * Returns a random digit as a string.
 *
 * @returns {string} A single digit character from '0' to '9'.
 */
function getRandomDigit() {
    return (0, crypto_1.randomInt)(0, 10).toString();
}
/**
 * Shuffles an array of strings in place using the Fisher-Yates algorithm.
 *
 * @param {string[]} array - The array to shuffle.
 * @returns {string[]} The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = (0, crypto_1.randomInt)(0, i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
/**
 * Generates a referral code consisting of 3 uppercase letters and 3 digits,
 * shuffled randomly.
 *
 * @returns {string} A 6-character referral code, e.g. "A9B2C1".
 */
function generateReferralCode() {
    const chars = [];
    // Add 3 random letters and 3 random digits in one loop for efficiency
    for (let i = 0; i < 3; i++) {
        chars.push(getRandomUppercaseLetter());
        chars.push(getRandomDigit());
    }
    // Shuffle the characters to randomize order
    return shuffleArray(chars).join('');
}
/**
 * Normalize a username by trimming extra spaces and capitalizing each word.
 *
 * This function:
 * - Removes leading and trailing whitespace
 * - Splits the input string by one or more whitespace characters
 * - Capitalizes the first letter of each word
 * - Converts the rest of the letters in each word to lowercase
 * - Joins the words back together with a single space
 *
 * Example:
 * ```
 * normalizeUsername("nITH in kUMar") // returns "Nith In Kumar"
 * normalizeUsername("  alice   JOHNSON ") // returns "Alice Johnson"
 * ```
 *
 * @param {string} name - The username string to normalize.
 * @returns {string} The normalized username with proper capitalization.
 */
function normalizeUsername(name) {
    return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
/**
 * @route   POST /signup
 * @desc    Register a new user (or update unverified user) and generate OTP
 * @access  Public
 *
 * Expected Request Body:
 * {
 *   "username": "JohnDoe",
 *   "mobile": "9876543210"
 * }
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "OTP sent successfully."
 * }
 *
 * Error Responses:
 * 400 - Invalid input or existing verified user
 * 500 - Internal server error
 */
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Step 1: Validate incoming request body using Zod (or any validator)
        const isValidSignup = UserValidator_1.signupValidator.safeParse(req.body);
        if (!isValidSignup.success) {
            return res.status(400).json({
                success: false,
                message: isValidSignup.error.errors[0].message
            });
        }
        const { username, mobile } = isValidSignup.data;
        // ✅ Step 2: Check if user already exists and is verified
        const existingUser = yield client_1.prisma.user.findUnique({
            where: { mobile },
            select: { verified: true }
        });
        if (existingUser && existingUser.verified) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }
        // ✅ Step 3: Generate OTP and set expiry time (20 minutes)
        const otp = generateOtp().toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        //  Normalise the username
        const normalizedUsername = normalizeUsername(username);
        // ✅ Step 4: Use a transaction to upsert user and create wallet
        yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 🧠 Upsert = create if not exists, update if exists
            const user = yield tx.user.upsert({
                where: { mobile },
                update: { username: normalizedUsername, otp, otpExpiry },
                create: { username, mobile, otp, otpExpiry },
                select: { userId: true }
            });
            // ⚠️ Wallet must be created after user is guaranteed to exist
            yield tx.wallet.create({
                data: {
                    userId: user.userId
                }
            });
        }));
        // ✅ Step 5: Respond with success (OTP sending to be handled separately)
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    }
    catch (error) {
        console.error("Signup Error:", error); // Log for debugging
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
/**
 * @route   POST /login
 * @desc    Initiate login for an existing user by generating and storing OTP
 * @access  Public
 *
 * Expected Request Body:
 * {
 *   "mobile": "9876543210"
 * }
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "OTP sent successfully."
 * }
 *
 * Error Responses:
 * 400 - Invalid input
 * 500 - Internal server error
 */
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Step 1: Validate incoming request body using Zod (or any validator)
        const isValidLogin = UserValidator_1.loginValidator.safeParse(req.body);
        if (!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            });
        }
        const { mobile } = isValidLogin.data;
        // ✅ Step 2: Check if the user exists
        const existingUser = yield client_1.prisma.user.findUnique({
            where: { mobile }
        });
        // 🛡️ Step 3: Respond with generic failure if user doesn't exist
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not registered."
            });
        }
        // ✅ Step 4: Generate OTP and set expiry time (10 minutes)
        const otp = generateOtp().toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        // ✅ Step 5: Update the user with new OTP and expiry
        yield client_1.prisma.user.update({
            where: { mobile },
            data: {
                otp,
                otpExpiry
            }
        });
        // ✅ Step 6: Respond with success (OTP sending to be handled separately)
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    }
    catch (error) {
        console.error("Login Error:", error); // Log for debugging
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
/**
 * @route   POST /verifyotp
 * @desc    Verify OTP and generate auth & refresh tokens
 * @access  Public
 *
 * Expected Request Body:
 * {
 *   "mobile": "9876543210",
 *   "otp": "123456"
 * }
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "OTP verified.",
 *   "authToken": "<jwt_token>",
 *   "refreshToken": "<refresh_jwt_token>"
 * }
 *
 * Error Responses:
 * 400 - Invalid input, expired OTP, or invalid OTP
 * 500 - Internal server error
 */
router.post("/verifyotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // ✅ Step 1: Validate request body using Zod
        const isValidOtp = UserValidator_1.otpValidator.safeParse(req.body);
        if (!isValidOtp.success) {
            return res.status(400).json({
                success: false,
                message: isValidOtp.error.errors[0].message
            });
        }
        const { mobile, otp } = isValidOtp.data;
        // ✅ Step 2: Fetch user by mobile number
        const user = yield client_1.prisma.user.findUnique({
            where: { mobile },
            select: {
                otp: true,
                otpExpiry: true,
                userId: true,
                username: true,
                mobile: true,
                createdAt: true,
                verified: true,
                referralCode: true
            }
        });
        // 🛡️ For security, do not reveal if user exists or not.
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }
        // ✅ Step 3: Check if OTP is expired
        if (new Date(user.otpExpiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired."
            });
        }
        // ✅ Step 4: Check if OTP matches
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }
        // ✅ Step 5: If first-time verification, generate referral code and mark as verified
        let referralCode = user.referralCode;
        if (!user.verified) {
            referralCode = generateReferralCode();
            yield client_1.prisma.user.update({
                where: { mobile },
                data: {
                    verified: true,
                    referralCode
                }
            });
        }
        // ✅ Step 6: Prepare token payload
        const data = {
            user: {
                userId: user.userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode
            }
        };
        // ✅ Step 7: Sign JWT tokens
        const authToken = jsonwebtoken_1.default.sign(data, `${(_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "secret"}`, { expiresIn: "15d" });
        const refreshToken = jsonwebtoken_1.default.sign(data, `${(_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : "secret"}`, { expiresIn: "20d" });
        // ✅ Step 8: Return tokens
        return res.status(200).json({
            success: true,
            message: "OTP verified.",
            authToken,
            refreshToken
        });
    }
    catch (error) {
        console.error("Verify OTP Error:", error); // helpful for debugging
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
/**
 * @route   POST /resendotp
 * @desc    Resend OTP to an existing user
 * @access  Public
 *
 * Expected Request Body:
 * {
 *   "mobile": "9876543210"
 * }
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "OTP sent successfully."
 * }
 *
 * Error Responses:
 * 400 - Invalid input or user does not exist
 * 500 - Internal server error
 */
router.post("/resendotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Step 1: Validate incoming request body using loginValidator (mobile only)
        const isValidLogin = UserValidator_1.loginValidator.safeParse(req.body);
        if (!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            });
        }
        const { mobile } = isValidLogin.data;
        // ✅ Step 2: Check if user exists
        const existingUser = yield client_1.prisma.user.findUnique({
            where: { mobile }
        });
        // ⚠️ For security reasons, you might want to avoid revealing if user exists or not
        if (!existingUser) {
            // Optional: You can send generic success message instead to avoid user enumeration
            return res.status(400).json({
                success: false,
                message: "Something went wrong."
            });
        }
        // ✅ Step 3: Generate new OTP and set expiry (e.g., 10 minutes)
        const otp = generateOtp().toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        // ✅ Step 4: Update user OTP and expiry in database
        yield client_1.prisma.user.update({
            where: { mobile },
            data: { otp, otpExpiry }
        });
        // ✅ Step 5: Respond with success (sending OTP should be handled separately)
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    }
    catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
}));
/**
 * @route   PUT /update
 * @desc    Update authenticated user's username and return refreshed JWT tokens
 * @access  Private (requires valid session)
 */
router.put('/update', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // ✅ Step 1: Verify authenticated userId from session middleware
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication."
            });
        }
        // ✅ Step 2: Fetch existing user data needed for token and response
        const user = yield client_1.prisma.user.findUnique({
            where: { userId },
            select: {
                mobile: true,
                createdAt: true,
                referralCode: true,
                username: true
            }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication."
            });
        }
        // ✅ Step 3: Validate incoming request body (username)
        const isValidUpdate = UserValidator_1.updateValidator.safeParse(req.body);
        if (!isValidUpdate.success) {
            return res.status(400).json({
                success: false,
                message: isValidUpdate.error.errors[0].message
            });
        }
        // ✅ Step 4: Extract validated username from request
        const { username } = isValidUpdate.data;
        //  Normalise the username
        const normalizedUsername = normalizeUsername(username);
        // ✅ Step 5: Update username in database is username is different
        if (user.username !== normalizedUsername) {
            yield client_1.prisma.user.update({
                where: { userId },
                data: { username: normalizedUsername }
            });
        }
        // ✅ Step 6: Prepare JWT payload with updated user info
        const tokenPayload = {
            user: {
                userId,
                username: normalizedUsername,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        };
        // ✅ Step 7: Generate new authToken and refreshToken with expiry
        const authToken = jsonwebtoken_1.default.sign(tokenPayload, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'secret', { expiresIn: '15d' });
        const refreshToken = jsonwebtoken_1.default.sign(tokenPayload, (_b = process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : 'secret', { expiresIn: '20d' });
        // ✅ Step 8: Return success response with new tokens
        return res.status(200).json({
            success: true,
            message: "User updated",
            authToken,
            refreshToken
        });
    }
    catch (error) {
        // ✅ Step 9: Handle unexpected errors and return 500
        console.error("User Update Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
/**
 * @route   POST /referral
 * @desc    Apply referral code for authenticated user and credit bonus to referrer wallet
 * @access  Private (requires valid session)
 *
 * Expected Request Body:
 * {
 *   "referralCode": "CODE123"
 * }
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "Referral successful."
 * }
 *
 * Error Responses:
 * 400 - Invalid auth, input validation error, user not verified, already referred,
 *       invalid referral code, referrer issues, or self-referral attempt
 * 500 - Internal server error
 */
router.post('/referral', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Step 1: Extract userId from verified session
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Invalid authentication." });
        }
        // ✅ Step 2: Validate request body using referralValidator
        const isValidReferral = UserValidator_1.referralValidator.safeParse(req.body);
        if (!isValidReferral.success) {
            return res.status(400).json({
                success: false,
                message: isValidReferral.error.errors[0].message
            });
        }
        const { referralCode } = isValidReferral.data;
        // Normalize referral code for case-insensitive match (optional)
        const normalizedReferralCode = referralCode.trim().toLowerCase();
        // ✅ Step 3: Fetch authenticated user with verification status and existing referral info
        const user = yield client_1.prisma.user.findUnique({
            where: { userId },
            select: {
                verified: true,
                referredBy: true, // existence check only
                referralCode: true, // to prevent self-referral
            }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid authentication." });
        }
        // ✅ Step 4: Check if user is verified
        if (!user.verified) {
            return res.status(400).json({ success: false, message: "User is not verified." });
        }
        // ✅ Step 5: Check if user is already referred
        if (user.referredBy) {
            return res.status(400).json({ success: false, message: "User is already referred." });
        }
        // ✅ Step 6: Prevent self-referral by comparing codes (case-insensitive)
        if (user.referralCode.toLowerCase() === normalizedReferralCode) {
            return res.status(400).json({ success: false, message: "Cannot use your own referral code." });
        }
        // ✅ Step 7: Find the referrer by referral code with required info
        const referrer = yield client_1.prisma.user.findFirst({
            where: {
                referralCode: {
                    equals: normalizedReferralCode,
                    mode: 'insensitive' // case-insensitive query (if supported by your DB)
                }
            },
            select: {
                userId: true,
                verified: true,
                wallet: { select: { walletId: true } }
            }
        });
        // ✅ Step 8: Validate referrer existence and verification
        if (!referrer) {
            return res.status(400).json({ success: false, message: "Invalid referral code." });
        }
        if (!referrer.verified) {
            return res.status(400).json({ success: false, message: "Referrer is not verified." });
        }
        if (!referrer.wallet) {
            return res.status(400).json({ success: false, message: "Referrer does not have a wallet." });
        }
        // ✅ Step 9: Use Prisma transaction to create referral and increment wallet balance atomically
        yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create referral link: referredBy = current user, referredTo = referrer
            const referral = yield tx.referral.create({
                data: {
                    referredBy: userId,
                    referredTo: referrer.userId
                },
                select: {
                    bonus: true
                }
            });
            // Return generic failed response if referral not found
            if (!referral) {
                return res.status(400).json({ success: false, message: "Failed to create referral." });
            }
            // Return generic failed response if referrer wallet not found
            if (!referrer.wallet) {
                return res.status(400).json({ success: false, message: "Failed to create referral." });
            }
            // Increment referrer wallet balance by bonus amount
            yield tx.wallet.update({
                where: { walletId: referrer.wallet.walletId },
                data: { balance: { increment: referral.bonus } }
            });
        }));
        // ✅ Step 10: Return success response
        return res.status(200).json({
            success: true,
            message: "Referral successful."
        });
    }
    catch (error) {
        console.error("Referral Error:", error);
        // ✅ Step 11: Handle unexpected server errors
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}));
/**
 * @route   GET /refresh
 * @desc    Refresh JWT tokens for authenticated user
 * @access  Private (requires valid session)
 *
 * This endpoint:
 * - Validates that the userId is present in the verified session
 * - Fetches the user data from the database to include in the new tokens
 * - Signs and returns new auth and refresh JWT tokens with updated expiration
 *
 * Success Response:
 * {
 *   "success": true,
 *   "message": "Token refreshed",
 *   "authToken": "<new JWT token>",
 *   "refreshToken": "<new refresh token>"
 * }
 *
 * Error Responses:
 * 400 - Invalid authentication (user not found)
 * 500 - Internal server error
 */
router.get('/refresh', verifySession_1.verifySession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Step 1: Extract userId from verified session (middleware ensures validity)
        const userId = req.userId;
        // If userId is not present, respond with 400
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication."
            });
        }
        // ✅ Step 2: Fetch user data required for token payload
        const user = yield client_1.prisma.user.findUnique({
            where: { userId },
            select: {
                username: true,
                referralCode: true,
                mobile: true,
                createdAt: true,
            }
        });
        // ✅ Step 3: If user does not exist, respond with 400
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication."
            });
        }
        // ✅ Step 4: Prepare JWT payload with user details
        const tokenPayload = {
            user: {
                userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        };
        // ✅ Step 5: Sign new tokens using strong JWT secret and reasonable expiry
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not set in environment variables.");
            return res.status(500).json({
                success: false,
                message: "Server configuration error."
            });
        }
        const authToken = jsonwebtoken_1.default.sign(tokenPayload, secret, { expiresIn: '15d' });
        const refreshToken = jsonwebtoken_1.default.sign(tokenPayload, secret, { expiresIn: '20d' });
        // ✅ Step 6: Return new tokens in success response
        return res.status(200).json({
            success: true,
            message: "Server configured successfully.",
            authToken,
            refreshToken
        });
    }
    catch (error) {
        // ✅ Step 7: Handle unexpected server errors
        console.error("Token refresh error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
exports.default = router;
