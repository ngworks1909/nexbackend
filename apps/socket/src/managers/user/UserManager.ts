import { User } from "./User";
import { claim_mines, game_not_found, init_game, insufficient_balance, load_loader, ludo_move_piece, ludo_roll_dice, pick_memory_card, select_mine, wallet_not_found } from "../../messages/message";
import { GameType, initGameValidator } from "../../zod/GameValidator";
import { roomManager } from "../room/RoomManager";
import { prisma } from "../../db/client";
import { appManager } from "../main/AppManager";
import { mineIndexValidator } from "../../zod/MinesValidator";
import { gameManager } from "../games/GameManager";
import { memoryIndexValidator } from "../../zod/MemoryValidator";
import { decryptGameToken } from "../../actions/decryptGameToken";


class UserManager {
    private static instance: UserManager
    private readonly onlineUsers: Map<string, User>
    constructor(){
        this.onlineUsers = new Map()
    }
    static getInstance(){
        if(UserManager.instance){
            return UserManager.instance;
        }
        UserManager.instance = new UserManager();
        return UserManager.instance;
    }

    addUser(user: User) {
        this.onlineUsers.set(user.userId, user);
        this.addGameListener(user);
        this.addMinesListener(user);
        this.addMemoryListener(user);
        this.addLudoListener(user)
    }

    removeUser(userId: string) {
        const roomId = appManager.userToRoomMapping.get(userId);
        if(roomId){
            roomManager.leaveRoom(roomId, userId)
        }
        this.onlineUsers.delete(userId)
    }

    getUser(userId: string) {
        return this.onlineUsers.get(userId)
    }

    private addGameListener(user: User){
        const ws = user.socket
        ws.on(init_game, async(data: string) => {
            if(!data) return;
            const isValidInit = initGameValidator.safeParse(data);
            if(!isValidInit.success) {
                return;
            };
            const seed = isValidInit.data
            const gameId = decryptGameToken(seed);
            const game = await prisma.game.findUnique({
                where:{
                    gameId
                },select: {
                    gameName: true,
                    entryFee: true,
                    maxPlayers: true,
                    winAmount: true
                }
            });
            if(!game){
                ws.emit(game_not_found)
                return
            }
            const message = JSON.stringify({players: game.maxPlayers.toString(), gameName: game.gameName});
            ws.emit(load_loader, message);
            roomManager.createOrJoinRoom(user, gameId, game.gameName, game.maxPlayers, game.entryFee, game.winAmount)
        })
    }

    private addMinesListener(user: User){
        user.socket.on(select_mine, (data: string) => {
            const roomId = appManager.userToRoomMapping.get(user.userId);
            if(!roomId) {
                return;
            };
            const message = JSON.parse(data);
            const isValidIndex = mineIndexValidator.safeParse(message);
            if(!isValidIndex.success) {
                return;
            };
            const {cardIndex} = isValidIndex.data;
            gameManager.fetchMinesGameAndPickCard(roomId, cardIndex)
        })

        user.socket.on(claim_mines, () => {
            const roomId = appManager.userToRoomMapping.get(user.userId);
            if(!roomId) {
                return;
            };
            gameManager.fetchMinesGameAndClaim(roomId)
        })
    }


    private addMemoryListener(user: User){
        user.socket.on(pick_memory_card, (data: string) => {
            const roomId = appManager.userToRoomMapping.get(user.userId);
            if(!roomId) {
                return;
            };
            const message = JSON.parse(data);
            const isValidIndex = memoryIndexValidator.safeParse(message);
            if(!isValidIndex.success) {
                console.log(isValidIndex.data);
                return;
            };
            const {cardId} = isValidIndex.data;
            gameManager.fetchMemoryGameAndPickCard(roomId, user.socket.id, cardId)
        })
    }

    private addLudoListener(user: User){
        user.socket.on(ludo_roll_dice, () => {
            const roomId = appManager.userToRoomMapping.get(user.userId);
            if(!roomId) {
                return;
            };
            gameManager.fetchLudoGameAndRollDice(roomId, user.socket.id)
        })

        user.socket.on(ludo_move_piece, (pieceId: string) => {
            const roomId = appManager.userToRoomMapping.get(user.userId);
            if(!roomId) {
                return;
            };
            gameManager.fetchLudoGameAndMovePiece(roomId, user.socket.id, pieceId)
        })
    }

}

export const userManager = UserManager.getInstance()