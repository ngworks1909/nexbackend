import { Bot } from "../../interfaces/GameInterface";
import { GameType } from "../../zod/GameValidator";
import { User } from "../user/User";
import { roomManager } from "./RoomManager";

type GameStatus = "PENDING" | "IN_PROGRESS" | "FINISHED"

export class Room {
    private _roomId: string;
    private _players: (User | Bot)[];
    private _gameType: GameType;
    private _maxPlayers: number;
    private _gameStatus: GameStatus = "PENDING";
    private _entryFee: number;
    private _gameId: string;
    private _winAmount: number;
    private _timeout: NodeJS.Timeout;
    constructor(roomId: string, gameId: string, player: User, gameType: GameType, maxPlayers: number, entryFee: number, winAmount: number) {
        this._roomId = roomId;
        this._gameId = gameId
        this._players = [player];
        this._gameType = gameType;
        this._maxPlayers = maxPlayers;
        this._entryFee = entryFee;
        this._winAmount = winAmount
        //emit event to the user that new game is created
        this._timeout = setTimeout(() => this._handleRoomTimeout(), 5000);
    }

    private _handleRoomTimeout() {
        if (this._players.length < this._maxPlayers) {
            roomManager.fillPendingRoom(this._roomId, this._gameId, this._gameType);
        }
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

    public addUser(user: User | Bot){    
        if (this._players.length < this._maxPlayers) {
            this._players.push(user);

            if (this._players.length === this._maxPlayers) {
                clearTimeout(this._timeout);
            }

            return true;
        }
        return false;
    }
}