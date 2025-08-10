import { createId } from "@paralleldrive/cuid2";

export class LudoBot{

    private _userId: string
    private _username: string
    private _socket: LudoSocket
    private _isActive: boolean = true

    constructor(userId: string, username: string){
        this._userId = userId;
        this._username = username
        this._socket = new LudoSocket(createId())
    }

    public get userId(){
        return this._userId
    }
    public get isActive(){
        return this._isActive
    }
    public get username(){
        return this._username
    }

    public get socket(){
        return this._socket
    }
}


export class LudoSocket{
    private _id: string
    constructor(id: string){
        this._id = id
    }

    public get id(){
        return this._id
    }


    public emit(event: string, data?: string){

    }

    public on(event: string, data?: string){

    }
}