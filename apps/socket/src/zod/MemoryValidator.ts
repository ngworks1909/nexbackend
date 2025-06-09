import z from 'zod'
export const memoryIndexValidator = z.object({
    cardId: z.number()
})