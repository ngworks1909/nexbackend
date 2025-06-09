import { prisma } from "../../../../db/client"
import { claim_mines_game, end_mine_game, open_gems_card, start_mine_game } from "../../../../messages/message"
import { appManager } from "../../../main/AppManager"
import { socketManager } from "../../../socketmanager/SocketManager"

type Card = {
    id: number
    isBomb: boolean
    isRevealed: boolean,
}

export class MineGame {
    private _roomId: string
    private cards: Card[]
    private _gameOver: boolean
    private INITIAL_AMOUNT;
    private readonly MULTIPLIER_PER_SAFE = 0.25
    private revealedSafeCards = 0
    private baseMultiplier = 1.3
    constructor(roomId: string){
        this._roomId = roomId
        const room = appManager.rooms.get(roomId)
        this.INITIAL_AMOUNT = room?.entryFee ?? 0
        this.cards = this.initializeCards()
        this._gameOver = false
        const message = JSON.stringify({investedAmount: this.INITIAL_AMOUNT})
        socketManager.broadcastToRoom(roomId, start_mine_game, message)
    }

    private initializeCards(): Card[] {
        const cards: Card[] = [];
        for (let i = 0; i < 16; i++) {
            cards.push({ id: i, isBomb: false, isRevealed: false });
        }
        let bombCount = 0
        while (bombCount < 3) {
          const randomIndex = Math.floor(Math.random() * 16)
          if (!cards[randomIndex].isBomb) {
            cards[randomIndex].isBomb = true
            bombCount++
            }
        }
        return cards;
    }

    public get gameOver(){
        return this._gameOver
    }

    public pickCard(cardIndex: number){
        if (this.gameOver || cardIndex < 0 || cardIndex >= this.cards.length) {
            return
        }
        if(this.cards[cardIndex].isRevealed) return;
        this.cards[cardIndex].isRevealed = true;
        if(this.cards[cardIndex].isBomb){
            this._gameOver = true
            this.cards.forEach((c) => {
                c.isRevealed = true;
            })
            const message = JSON.stringify({endCards: this.cards})
            socketManager.broadcastToRoom(this._roomId, end_mine_game, message)
            return
        }

        this.revealedSafeCards++
        const additionalMultiplier = (this.revealedSafeCards - 1) * this.MULTIPLIER_PER_SAFE
        const totalMultiplier = this.baseMultiplier + additionalMultiplier
        const wonAmount = Math.round(this.INITIAL_AMOUNT * totalMultiplier)
        const message = JSON.stringify({wonAmount, cardIndex, multiplier: totalMultiplier, revealedSafeCards:this.revealedSafeCards})
        socketManager.broadcastToRoom(this._roomId, open_gems_card, message) 
    }

    public async claimAmount(){
        if(this.gameOver) return;
        this._gameOver = true;
        this._gameOver = true
        this.cards.forEach((c) => {
            c.isRevealed = true;
        })
        const additionalMultiplier = (this.revealedSafeCards - 1) * this.MULTIPLIER_PER_SAFE
        const totalMultiplier = this.baseMultiplier + additionalMultiplier
        const wonAmount = Math.round(this.INITIAL_AMOUNT * totalMultiplier);
        const room = appManager.rooms.get(this._roomId);
        if(!room) return;
        room.gameStatus = "FINISHED";
        const winner = room.players[0]
        const user = await prisma.user.findUnique({
            where: {
                userId: winner.userId
            },
            select: {
                userId: true,
                wallet: {
                    select: {
                        walletId: true
                    }
                }
            }
        })
        if(!user || !user.wallet) return
        const existingRoom = await prisma.room.findUnique({
            where: {
                roomId: this._roomId
            },
            select: {
                roomId: true
            }
        });
        if(!existingRoom) return
        prisma.$transaction(async(tx) => {
            await tx.room.update({
                where: {
                    roomId: this._roomId
                },
                data: {
                    winnerId: user.userId,
                    winAmount: wonAmount
                }
            });
            await tx.wallet.update({
                where: {
                    walletId: user.wallet?.walletId
                },
                data: {
                    balance: {
                        increment: wonAmount
                    }
                }
            })

        }).then(() => {
            const message = JSON.stringify({endCards: this.cards, wonAmount})
            socketManager.broadcastToRoom(this._roomId, claim_mines_game, message)
        })
        
    }
}