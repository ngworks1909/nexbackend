import { GameType } from "../../zod/GameValidator";
import { User } from "../user/User";

type GameStatus = "PENDING" | "IN_PROGRESS" | "FINISHED"

export class Room {
    private _roomId: string;
    private _players: User[];
    private _gameType: GameType;
    private _maxPlayers: number;
    private _gameStatus: GameStatus = "PENDING";
    private _entryFee: number;
    private _gameId: string;
    private _winAmount: number
    constructor(roomId: string, gameId: string, player: User, gameType: GameType, maxPlayers: number, entryFee: number, winAmount: number) {
        this._roomId = roomId;
        this._gameId = gameId
        this._players = [player];
        this._gameType = gameType;
        this._maxPlayers = maxPlayers;
        this._entryFee = entryFee;
        this._winAmount = winAmount
        //emit event to the user that new game is created
    }

    public get roomId(){
        return this._roomId
    }

    public get gameId(){
        return this._gameId
    }

    public get winAmount(){
        return this._winAmount
    }

    public get players(){
        return this._players
    }

    public get gameType(){
        return this._gameType
    }

    public get maxPlayers(){
        return this._maxPlayers
    }

    public get gameStatus(){
        return this._gameStatus
    }

    public set gameStatus(gameStatus: GameStatus){
        this._gameStatus = gameStatus;
    }

    public get entryFee(){
        return this._entryFee
    }

    public addUser(user: User){    
        if(this.players.length < this.maxPlayers){
            this.players.push(user);
            //emit event to all the users
            return true
        }
        return false
    }
}