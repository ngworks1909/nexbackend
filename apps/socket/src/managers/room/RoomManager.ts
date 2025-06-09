import { prisma } from "../../db/client";
import { room_created } from "../../messages/message";
import { GameType } from "../../zod/GameValidator";
import { gameManager } from "../games/GameManager";
import { appManager } from "../main/AppManager";
import { Room } from "../room/Room";
import { User } from "../user/User";
import { createId } from "@paralleldrive/cuid2";

interface IRoomManager {
    createOrJoinRoom(user: User, gameId: string, gameName: GameType, maxPlayers: number, entryFee: number, winAmount: number): void
}

class RoomManager implements IRoomManager  {
    private static instance: RoomManager;

    static getInstance(){
        if(RoomManager.instance){
            return RoomManager.instance;
        }
        RoomManager.instance = new RoomManager();
        return RoomManager.instance;
    }

    private userAlreadyExistsInRoom(userId: string){
        return appManager.userToRoomMapping.has(userId)
    }

    private joinToPreviousRoom(user: User){
        //get the previous roomId
        const roomId = appManager.userToRoomMapping.get(user.userId);
        //roomId doesnt exists means game is over
        if(!roomId) return false;
        //get the previous room using the roomId
        const previousRoom = appManager.rooms.get(roomId);
        //check is room exists and game is not completed return false of not matched
        if(!previousRoom || previousRoom.gameStatus === "FINISHED") return false;
        //find the user place in previous room
        const userIndex = previousRoom.players.findIndex(player => player.userId === user.userId);
        //if user place does not exist return false
        if(userIndex == -1) return false
        //replace the previous details with new socket
        previousRoom.players[userIndex] = user;
        //return true user is back
        return true
    }

    private joinRoom(roomId: string, user: User, gameId: string){
        //find the pending room
        const pendingRoom = appManager.rooms.get(roomId);
        //if pending room does not exists return false
        if(!pendingRoom) return false;
        // room exists try to join
        const joinStatus = pendingRoom.addUser(user);
        //if join failed return false
        if(!joinStatus) return false;
        //check if the max players reached
        const players = pendingRoom.players
        if(players.length === pendingRoom.maxPlayers){
            //create a room in db and connect the players
            try {
                prisma.room.create({
                    data: {
                        roomId,
                        gameId,
                        players: {
                            connect: players.map(player => ({ userId: player.userId }))
                        }
                    }
                }).then(() => {
                    //make game to in progress
                    pendingRoom.gameStatus = "IN_PROGRESS";
                    //remove the gameId with pendind roomId
                    appManager.pendingRooms.delete(gameId)
                    //create a game object
                    gameManager.createGame(pendingRoom.roomId, pendingRoom.gameType)
                    appManager.userToRoomMapping.set(user.userId, roomId);
                    return true;
                })
            } catch (error) {
                return false;
            } 
        }
        //set the user playing in the room
        appManager.userToRoomMapping.set(user.userId, roomId);
        //return player pushed is true
        return true;
    }

    private createRoom(user: User, gameId: string, gameName: GameType, maxPlayers: number, entryFee: number, winAmount: number){
        
        //create a new roomId 
        const roomId = createId();
        //create new room
        const room = new Room(roomId, gameId, user, gameName, maxPlayers, entryFee, winAmount);
        //set the new room
        appManager.rooms.set(roomId, room);
        //set the user playing in the room
        appManager.userToRoomMapping.set(user.userId, roomId);
        if(maxPlayers === 1){
            room.gameStatus = "IN_PROGRESS";
            //remove the gameId with pendind roomId
            appManager.pendingRooms.delete(gameId)
            //create a game object
            prisma.room.create({
                data: {
                    roomId,
                    gameId,
                    players: {
                        connect: [
                            {userId: user.userId}
                        ]
                    }
                }
            }).then(() => {
                gameManager.createGame(roomId, gameName)
                return
            })
            
        }
        //mark the room as pending room
        appManager.pendingRooms.set(gameId, roomId)
        //emiting event to user that room has created
        user.socket.emit(room_created)
    }

    public leaveRoom(roomId: string, userId: string){
        const room = appManager.rooms.get(roomId);
        if(!room) return;
        if(room.gameStatus !== "PENDING") return
        const userIndex = room.players.findIndex(player => player.userId === userId);
        if(userIndex === -1) return;
        room.players.splice(userIndex, 1);
        appManager.userToRoomMapping.delete(userId)
    }


    public createOrJoinRoom(user: User, gameId: string, gameName: GameType, maxPlayers: number, entryFee: number, winAmount: number) {
        //check if user exists in room
        //if yes, join the room with new socket id
        //if no, create a new room

        //TODO: This code is for reconnecting but should be done while connecting not with init game
        // if(this.userAlreadyExistsInRoom(user.userId)){
        //     //join the previous room
        //     const isJoined = this.joinToPreviousRoom(user);
        //     if(isJoined){
        //         //emit to all users the user is back
        //         return;
        //     }
        // }



        //push to new pending room or create new one if failed to push to new room or doesnt exist in room

        //find the pending roomId with gameId
        const pendingRoomId = appManager.pendingRooms.get(gameId);
        //if pending room exists
        if(pendingRoomId){
            //try to join
            const isJoined =  this.joinRoom(pendingRoomId, user, gameId);
            //if joined then return 
            if(isJoined) return
        }
        //else create new room if failed to join or pending room doesnt exists
        this.createRoom(user, gameId, gameName, maxPlayers, entryFee, winAmount);
    }


}

export const roomManager = RoomManager.getInstance();