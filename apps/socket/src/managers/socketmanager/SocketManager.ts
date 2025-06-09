import { appManager } from "../main/AppManager";

class SocketManager {
    private static instance: SocketManager;

    static getInstance(){
        if(SocketManager.instance){
            return SocketManager.instance;
        }
        SocketManager.instance = new SocketManager();
        return SocketManager.instance;
    }

    broadcastToRoom(roomId: string, event: string, data?: string){
        const room = appManager.rooms.get(roomId);
        if(!room) return;
        room.players.forEach(player => player.socket.emit(event, data))
    }
}


export const socketManager = SocketManager.getInstance();
