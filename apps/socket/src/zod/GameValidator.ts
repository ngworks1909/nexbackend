import z from 'zod'


export const gameTypeSchema = z.enum(["LUDO", "MINES", "MEMORY"]);

export type GameType = z.infer<typeof gameTypeSchema>

export const initGameValidator = z.string()
