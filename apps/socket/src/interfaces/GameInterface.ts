import { LudoBot } from "../bots/LudoBot"
import { MemoryBot } from "../bots/MemoryBot"
import { User } from "../managers/user/User"

export interface Player {
    username: string,
    socketId: string
}


export type Bot = LudoBot | MemoryBot