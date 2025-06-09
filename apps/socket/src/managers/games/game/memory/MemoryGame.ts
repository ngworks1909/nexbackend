import { prisma } from "../../../../db/client";
import { Player } from "../../../../interfaces/GameInterface";
import { end_memory_game, match_memory_card, open_memory_card, start_memory_game, unmatch_memory_card } from "../../../../messages/message";
import { appManager } from "../../../main/AppManager";
import { socketManager } from "../../../socketmanager/SocketManager";



interface MemoryCardInterface{
    id: number,
    imageKey: string,
    isFlipped: boolean,
    isMatched: boolean
}

export class MemoryGame {
    private roomId: string
    private _gameOver: boolean
    private currentPlayer: string = ""
    private cards: MemoryCardInterface[];
    private card1Index: number | null = null;
    private player1Score: number = 0;
    private player2Score: number = 0;
    constructor(roomId: string){
        this.roomId = roomId;
        this._gameOver = false;
        this.cards = this.initializeCards();
        const room = appManager.rooms.get(roomId);
        if(!room) return;
        const players = room.players;
        const data:Player[] = []
        players.forEach(player => {
            data.push({socketId: player.socket.id, username: player.username})
        })
        this.currentPlayer = data[1].socketId as string
        const message = JSON.stringify({players: data, currentPlayer: this.currentPlayer})
        socketManager.broadcastToRoom(roomId, start_memory_game , message)
    }

    private initializeCards(): MemoryCardInterface[] {
        const cards: MemoryCardInterface[] = [
            { id: 0, imageKey: "ball", isFlipped: false, isMatched: false },
            { id: 1, imageKey: "bee", isFlipped: false, isMatched: false },
            { id: 2, imageKey: "bug", isFlipped: false, isMatched: false },
            { id: 3, imageKey: "bulb", isFlipped: false, isMatched: false },
            { id: 4, imageKey: "bus", isFlipped: false, isMatched: false },
            { id: 5, imageKey: "cat", isFlipped: false, isMatched: false },
            { id: 6, imageKey: "panda", isFlipped: false, isMatched: false },
            { id: 7, imageKey: "strawberry", isFlipped: false, isMatched: false },
            { id: 8, imageKey: "sun", isFlipped: false, isMatched: false },
            { id: 9, imageKey: "sword", isFlipped: false, isMatched: false },
            { id: 10, imageKey: "watermelon", isFlipped: false, isMatched: false },
            { id: 11, imageKey: "ball", isFlipped: false, isMatched: false },
            { id: 12, imageKey: "bee", isFlipped: false, isMatched: false },
            { id: 13, imageKey: "bug", isFlipped: false, isMatched: false },
            { id: 14, imageKey: "bulb", isFlipped: false, isMatched: false },
            { id: 15, imageKey: "bus", isFlipped: false, isMatched: false },
            { id: 16, imageKey: "cat", isFlipped: false, isMatched: false },
            { id: 17, imageKey: "panda", isFlipped: false, isMatched: false },
            { id: 18, imageKey: "strawberry", isFlipped: false, isMatched: false },
            { id: 19, imageKey: "sun", isFlipped: false, isMatched: false },
            { id: 20, imageKey: "sword", isFlipped: false, isMatched: false },
            { id: 21, imageKey: "watermelon", isFlipped: false, isMatched: false }
        ];
    
        return cards.sort(() => Math.random() - 0.5);
    }
    

    private isValidTurn(playerId: string){
        return this.currentPlayer === playerId
    }

    private updateTurn(){
        const room = appManager.rooms.get(this.roomId);
        if(!room) return this.currentPlayer;
        const players = room.players;
        if(players[0].socket.id === this.currentPlayer){
            this.currentPlayer = players[1].socket.id;
        }
        else{
            this.currentPlayer = players[0].socket.id
        }
        return this.currentPlayer;
    }

    private getUpdatedScores(){
        const room = appManager.rooms.get(this.roomId);
        if(room){
            const players = room.players;
            if(players[0].socket.id === this.currentPlayer){
                this.player1Score++;
            }
            else{
                this.player2Score++;
            }
        }
        return {player1Score: this.player1Score, player2Score: this.player2Score} 
    }

    public pickCard(playerId: string, cardIndex: number){
        if(!this.isValidTurn(playerId)) {
            return;
        }
        if(cardIndex < 0 || cardIndex > 21) return
        if(this.cards[cardIndex].isFlipped || this.cards[cardIndex].isMatched) return
        this.cards[cardIndex].isFlipped = true;
        if(this.card1Index === null){
            this.card1Index = cardIndex;
            const imageKey = this.cards[cardIndex].imageKey;
            const message = JSON.stringify({cardIndex, imageKey});
            socketManager.broadcastToRoom(this.roomId, open_memory_card, message);
            return;
        }
        if(this.card1Index === cardIndex) return;
        const image1 = this.cards[this.card1Index].imageKey;
        const image2 = this.cards[cardIndex].imageKey;
        if(image1 === image2){
            this.cards[this.card1Index].isMatched = true;
            this.cards[cardIndex].isMatched = true;
            const card1Index = this.card1Index;
            this.card1Index = null;
            const {player1Score, player2Score} = this.getUpdatedScores();
            const end = ( player1Score + player2Score ) === 11
            const message = JSON.stringify({card1Index, card2Index: cardIndex, player1Score, player2Score, end});
            socketManager.broadcastToRoom(this.roomId, match_memory_card, message);
            if(end) this.endGame();
            return;
        }

        this.cards[this.card1Index].isFlipped = false;
        this.cards[cardIndex].isFlipped = false;
        const currentTurn = this.updateTurn();
        const card1Index = this.card1Index;
        this.card1Index = null;
        const message = JSON.stringify({card1Index, card2Index: cardIndex, imageKey: image2, currentTurn });
        socketManager.broadcastToRoom(this.roomId, unmatch_memory_card, message); 
    }
    public get gameOver(){
        return this._gameOver
    }

    private async endGame(){
        const room = appManager.rooms.get(this.roomId);
        if(!room) return;
        room.gameStatus = "FINISHED";
        this._gameOver = true;
        const players = room.players;
        const winner = this.player1Score > this.player2Score ? players[0]: players[1]
        const winnerId = winner.userId
        const winnerSocketId = winner.socket.id
        await prisma.room.update({
            where: {
                roomId: this.roomId
            },
            data: {
                winnerId,
                winAmount: room.winAmount
            }
        });

        const message = JSON.stringify({winnerId: winnerSocketId, winAmount: room.winAmount});
        socketManager.broadcastToRoom(this.roomId, end_memory_game, message);
    }
}