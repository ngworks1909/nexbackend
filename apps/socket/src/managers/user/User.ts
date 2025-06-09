import { Socket } from "socket.io";

export class User {
    private _userId: string; // Renamed to _userId
    private _socket: Socket; // Renamed to _socket
    private _isActive: boolean = true;
    private _username: string

    constructor(userId: string, username: string, socket: Socket) {
        this._userId = userId;
        this._socket = socket;
        this._username = username
    }

    public get userId() {
        return this._userId;
    }

    public get socket() {
        return this._socket;
    }

    public get username(){
        return this._username
    }

    public get isActive(){
        return this._isActive
    }

    public set isActive(isActive: boolean){
        this._isActive = isActive
    }
}
