import { Room } from "../room/Room";

class AppManager {
    private static instance: AppManager;

    // map roomId to room
    private _rooms: Map<string, Room>;

    // map userId ----> roomId
    private _userToRoomMapping: Map<string, string>

    //map gameId ----> roomId
    private _pendingRooms: Map<string, string | null>;

    constructor(){
        this._rooms = new Map();
        this._userToRoomMapping = new Map();
        this._pendingRooms = new Map();
    }

    static getInstance(){
        if(AppManager.instance){
            return AppManager.instance;
        }
        AppManager.instance = new AppManager();
        return AppManager.instance;
    }

    public get rooms(){
        return this._rooms
    }

    public get userToRoomMapping(){
        return this._userToRoomMapping
    }

    public get pendingRooms(){
        return this._pendingRooms
    }


}

export const appManager = AppManager.getInstance();