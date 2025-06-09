import { Player } from "../../../../interfaces/GameInterface";
import { ludo_enable_pile_selection, ludo_dice_rolled, start_ludo_game, ludo_update_turn, ludo_enable_cell_selection, ludo_update_move, ludo_kill_piece, ludo_player_home, ludo_player_win } from "../../../../messages/message";
import { appManager } from "../../../main/AppManager";
import { socketManager } from "../../../socketmanager/SocketManager";
import { User } from "../../../user/User";

export interface Piece {
    id: string,
    pos: number,
    travelCount: number
}

export interface Position {
    id: string, 
    pos: number
}

export interface PlayerState {
    index: number,
    socketId: string,
    username: string,
    pieces: Piece[]
}


class Dice{
    private _diceValue: number = 1;
    private _isDiceRolled: boolean = false;

    public get diceValue(){
        return this._diceValue;
    }

    public set isDiceRolled(status: boolean){
        this._isDiceRolled = status
    }

    public get isDiceRolled(){
        return this._isDiceRolled
    }

    public async rollDice(){
        if(this._isDiceRolled) return;
        this._diceValue = 6;
        this._isDiceRolled = true;
    }

}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const StarSpots = [9, 22, 35, 48];
const turningPoints = [52, 13, 26, 39];
const victoryStart = [111, 221, 331, 441];
const startingPoints = [1, 14, 27, 40];
const SafeSpots = [
    221, 222, 223, 224, 225, 14, 27, 331, 332, 333, 334, 335, 40, 441, 442, 443,
    444, 445, 1, 111, 112, 113, 114, 115,
  ];




export class LudoGame {
    private _roomId: string;
    private currentPlayer: string = "";
    private players: PlayerState[] = [];
    private diceManager: Dice = new Dice();
    private currentPositions: Position[] = [];
    private isBlocked: boolean = true;
    private _gameOver: boolean = false;
    constructor(roomId: string){
        this._roomId = roomId;
        const room = appManager.rooms.get(roomId);
        if(!room) return;
        const players = room.players;
        this.initializeGame(players).then(() => {
            const data:Player[] = []
            players.forEach(player => {
                data.push({socketId: player.socket.id, username: player.username})
            })
            this.currentPlayer = data[0].socketId as string
            const message = JSON.stringify({players: data, currentPlayer: this.currentPlayer})
            socketManager.broadcastToRoom(roomId, start_ludo_game , message)
        })
    }

    private async initializeGame(users: User[]){
        const player1: PlayerState = {
            index: 0,
            socketId: users[0].socket.id,
            username: users[0].username,
            pieces: [
                { id: "A1", pos: 0, travelCount: 0 },
                { id: "A2", pos: 0, travelCount: 0 },
                { id: "A3", pos: 0, travelCount: 0 },
                { id: "A4", pos: 0, travelCount: 0 }
            ]
        };
        
        const player2: PlayerState = {
            index: 1,
            socketId: users[1].socket.id,
            username: users[1].username,
            pieces: [
                { id: "B1", pos: 0, travelCount: 0 },
                { id: "B2", pos: 0, travelCount: 0 },
                { id: "B3", pos: 0, travelCount: 0 },
                { id: "B4", pos: 0, travelCount: 0 }
            ]
        };
        
        const player3: PlayerState = {
            index: 2,
            socketId: users[2].socket.id,
            username: users[2].username,
            pieces: [
                { id: "C1", pos: 0, travelCount: 0 },
                { id: "C2", pos: 0, travelCount: 0 },
                { id: "C3", pos: 0, travelCount: 0 },
                { id: "C4", pos: 0, travelCount: 0 }
            ]
        };
        
        const player4: PlayerState = {
            index: 3,
            socketId: users[3].socket.id,
            username: users[3].username,
            pieces: [
                { id: "D1", pos: 0, travelCount: 0 },
                { id: "D2", pos: 0, travelCount: 0 },
                { id: "D3", pos: 0, travelCount: 0 },
                { id: "D4", pos: 0, travelCount: 0 }
            ]
        };
        
        this.players = [player1, player2, player3, player4];
    }


    public get gameOver(){
        return this._gameOver
    }


    private isValidTurn(playerId: string){
        return this.currentPlayer === playerId
    }

    private updateTurn(){
        const nextPlayer = this.players.find(player => player.socketId === this.currentPlayer);
        if(!nextPlayer) return;
        this.currentPlayer = this.players[(nextPlayer.index + 1) % 4].socketId;
        this.diceManager.isDiceRolled = false
    }

    private getPlayerIndex(playerId: string){
        return this.players.findIndex(player => player.socketId === playerId);
    }

    private getPlayerPiecesByPlayerId(playerId: string){
        return (this.players.find(player => player.socketId === playerId)as PlayerState).pieces
    }

    private getPlayerPiecesByIndex(index: number){
        return this.players[index].pieces
    }

    public rollDice(playerId: string){
        if(!this.isValidTurn(playerId)) return;
        if(this.diceManager.isDiceRolled) return;
        this.diceManager.rollDice().then(() => {
            const diceValue = this.diceManager.diceValue
            const message = JSON.stringify({diceValue})
            socketManager.broadcastToRoom(this._roomId, ludo_dice_rolled, message);
            this.isBlocked = false

            const playerIndex = this.getPlayerIndex(playerId)
            const playerPieces = this.getPlayerPiecesByIndex(playerIndex);
            const isAnyPieceAlive = playerPieces.findIndex(piece => piece.pos !== 0 && piece.pos !== 57)
            const isAnyPieceLocked = playerPieces.findIndex(piece => piece.pos === 0);

            if(isAnyPieceAlive === -1){
                if(diceValue === 6){
                    this.isBlocked = false
                    const message = JSON.stringify({playerNo: playerIndex + 1})
                    socketManager.broadcastToRoom(this._roomId, ludo_enable_pile_selection, message)
                }
                else{
                  this.updateTurn()
                  delay(600).then(() => {
                    const message = JSON.stringify({currentPlayer: this.currentPlayer})
                    socketManager.broadcastToRoom(this._roomId, ludo_update_turn, message)
                  })
                }
            }
            else {
                const canMove = playerPieces.some(piece => piece.travelCount + diceValue <= 57 && piece.pos !== 0);
                if(
                  (!canMove && diceValue === 6 && isAnyPieceLocked === -1) ||
                  (!canMove && diceValue !== 6 && isAnyPieceLocked !== -1) ||
                  (!canMove && diceValue !== 6 && isAnyPieceLocked === -1)
                 ){
                  this.updateTurn()
                  delay(600).then(() => {
                    const message = JSON.stringify({currentPlayer: this.currentPlayer})
                    socketManager.broadcastToRoom(this._roomId, ludo_update_turn, message)
                  })
                }
                else{
                  const message = JSON.stringify({playerNo: playerIndex + 1});
                  this.isBlocked = false
                  if(diceValue === 6){
                    socketManager.broadcastToRoom(this._roomId, ludo_enable_pile_selection, message)
                  }
                  socketManager.broadcastToRoom(this._roomId, ludo_enable_cell_selection, message)
                }
            }
        });
    }

    private getMapper(id: string){
        const start = id[0]
        switch(start){
            case "A":
                return 0;
            case "B":
                return 1;
            case "C":
                return 2;
            case "D":
                return 3;
            default:
                return 0;
        }
    }


    public movePiece(playerId: string, pieceId: string){
        if(!this.isValidTurn(playerId)) return;
        if(!this.diceManager.isDiceRolled || this.isBlocked) return
        this.isBlocked = true;
        const diceValue = this.diceManager.diceValue
        const playerIndex = this.getPlayerIndex(playerId)
        const playerPieces = this.getPlayerPiecesByPlayerId(playerId);
        const pieceIndex = playerPieces.findIndex(piece => piece.id === pieceId);
        const piece = playerPieces[pieceIndex];
        if(piece.pos === 0){
            if(diceValue !== 6) return
            const startPosition = startingPoints[playerIndex]
            this.players[playerIndex].pieces[pieceIndex].pos = startPosition;
            this.players[playerIndex].pieces[pieceIndex].travelCount = 1;
            this.currentPositions.push({id: piece.id, pos: startPosition});
            const message = JSON.stringify({pieceId: piece.id, pos: startPosition, travelCount: 1, playerId})
            socketManager.broadcastToRoom(this._roomId, ludo_update_move, message);
            this.diceManager.isDiceRolled = false
            return
        }

        let currentPos = piece.pos;
        let travelCount = piece.travelCount;
        if(travelCount + diceValue > 57) return
        for(let i = 0; i < diceValue; i++){
            currentPos += 1;
            if (turningPoints.includes(currentPos) && turningPoints[playerIndex] === currentPos) {
                currentPos = victoryStart[playerIndex];
            }
          
            if (currentPos === 53) {
              currentPos = 1;
            }
            travelCount += 1;
        }
        const positionIndex = this.currentPositions.findIndex(position => position.id === pieceId);
        if(positionIndex !== -1){
            this.currentPositions.push({id: piece.id, pos: currentPos});
        }
        else{
            this.currentPositions[positionIndex] = {id: piece.id, pos: currentPos};
        }
        this.players[playerIndex].pieces[pieceIndex].pos = currentPos;
        this.players[playerIndex].pieces[pieceIndex].travelCount = travelCount;
        this.updateMove(playerId, currentPos, travelCount, pieceId)
        // socketManager.broadcastToRoom(this._roomId, ludo_update_move, JSON.stringify({pieceId: piece.id, pos: currentPos, travelCount: travelCount}))
    }

    private checkWin(pieces: Piece[]){
        return pieces.every(piece => piece.travelCount === 57)
    }
    

    private updateMove(playerId: string, currentPos: number, travelCount: number, pieceId: string){
        if(!this.diceManager.isDiceRolled || !this.isBlocked) return
        const updatedPositions = this.currentPositions;
        const collidingPieces = updatedPositions.filter(item => item.pos === currentPos);
        const ids = collidingPieces.map(item => item.id[0]);
        const uniqueIds = new Set(ids);
        const areDifferentIds = uniqueIds.size > 1;

        if (areDifferentIds && !SafeSpots.includes(collidingPieces[0].pos) && !StarSpots.includes(collidingPieces[0].pos)) {
            const enemyPiece = collidingPieces.find(piece => piece.id[0] !== pieceId[0]) as Position;
            const enemyId = enemyPiece.id;
            const enemyIndexInCurrentPositions = this.currentPositions.findIndex(position => position.id === enemyId);
            this.currentPositions.splice(enemyIndexInCurrentPositions, 1);
            const enemyIndex = this.getMapper(enemyId);
            const enemyPieceIndex = this.players[enemyIndex].pieces.findIndex(piece => piece.id === enemyId);
            this.players[enemyIndex].pieces[enemyPieceIndex].pos = 0;
            this.players[enemyIndex].pieces[enemyPieceIndex].travelCount = 0;
            const message = JSON.stringify({
                player: {
                    playerId,
                    pieceId,
                    pos: currentPos,
                    travelCount
                },
                kill: {
                    pieceId: enemyId,
                }
            })
            socketManager.broadcastToRoom(this._roomId, ludo_kill_piece, message);
            this.diceManager.isDiceRolled = false
            return;
        }

        socketManager.broadcastToRoom(this._roomId, ludo_update_move, JSON.stringify({pieceId, pos: currentPos, travelCount: travelCount, playerId}));
        this.diceManager.isDiceRolled = false
        if(this.diceManager.diceValue === 6 || travelCount === 57){
            const message = JSON.stringify({currentPlayer: this.currentPlayer,})
            socketManager.broadcastToRoom(this._roomId, ludo_update_turn, message)
            if(travelCount === 57){
                socketManager.broadcastToRoom(this._roomId, ludo_player_home);
                const playerPieces = this.getPlayerPiecesByPlayerId(playerId);
                if(this.checkWin(playerPieces)){
                    socketManager.broadcastToRoom(this._roomId, ludo_player_win, JSON.stringify({playerId}));
                }
            }
            return;
        }

        this.updateTurn();
        socketManager.broadcastToRoom(this._roomId, ludo_update_turn, JSON.stringify({currentPlayer: this.currentPlayer}));

    }


}
