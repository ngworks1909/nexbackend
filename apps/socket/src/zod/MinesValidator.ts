import z from 'zod'

export const mineIndexValidator = z.object({
    cardIndex: z.number()
})