"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGameTokenSchema = exports.fetchGameValidator = exports.gameTypeSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.gameTypeSchema = zod_1.default.enum(["LUDO", "MINES", "MEMORY"], { message: "Invalid game type" });
exports.fetchGameValidator = zod_1.default.object({
    gameType: exports.gameTypeSchema
});
exports.createGameTokenSchema = zod_1.default.object({
    gameId: zod_1.default.string({ message: "Invalid game id" }),
});
