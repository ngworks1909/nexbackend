import z from 'zod';

export const gameTypeSchema = z.enum(["LUDO", "MINES", "MEMORY"], {message: "Invalid game type"});

export const fetchGameValidator = z.object({
    gameType: gameTypeSchema
})

export const createGameTokenSchema = z.object({
    gameId: z.string({message: "Invalid game id"}),
})







