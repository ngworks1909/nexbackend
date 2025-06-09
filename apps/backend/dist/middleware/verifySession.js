"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySession = verifySession;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifySession(req, res, next) {
    const token = req.headers['authorization']; // Assuming Bearer token format
    if (!token) {
        return res.status(401).send('Unauthorized token'); // Unauthorized
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
        if (!decoded.user.userId) {
            return res.status(400).json({ success: false, message: "Invalid token" });
        }
        else {
            req.userId = decoded.user.userId;
            next();
        }
    }
    catch (error) {
        return res.status(403).send('Forbidden error');
    }
}
