import { MemoryCardInterface } from "../managers/games/game/memory/MemoryGame";
import { match_memory_card, open_memory_card, start_memory_game, unmatch_memory_card } from "../messages/message";
import { appManager } from "../managers/main/AppManager";
import { gameManager } from "../managers/games/GameManager";

import { randomBytes } from 'crypto';
import { createId } from "@paralleldrive/cuid2";
import { delay } from "../actions/delay";

function getSecureRandomInt(max: number): number {
  const buf = randomBytes(4); // 4 bytes = 32 bits
  const randomValue = buf.readUInt32BE(0);
  return randomValue % (max + 1);
}

export class MemoryBot{

    private _userId: string
    private _username: string
    private _socket: MemorySocket
    private _isActive: boolean = true

    constructor(userId: string, username: string, roomId: string){
        this._userId = userId;
        this._username = username
        this._socket = new MemorySocket(createId(), roomId)
    }

    public get userId(){
        return this._userId
    }

    public get username(){
        return this._username
    }

    public get socket(){
        return this._socket
    }
}


interface CardInterface{
    id: number,
    imageKey: string,
    isMatched: boolean
}


export class MemorySocket {
    private _id: string;
    private roomId: string;
    private currentPlayer: string = "";
    private opened_cards: CardInterface[] = [];
    private unmatched_cards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

    constructor(id: string, roomId: string) {
        this._id = id;
        this.roomId = roomId;
    }

    public get id() {
        return this._id;
    }

    private pickChoosedCards(card1Index: number, card2Index: number) {
        delay(1000).then(() => {
            gameManager.fetchMemoryGameAndPickCard(this.roomId, this.id, card1Index);
            delay(2000).then(() => {
                gameManager.fetchMemoryGameAndPickCard(this.roomId, this.id, card2Index);
            });
        });
    }

    private findRandomIndexesAndPickCards() {

        if(this.unmatched_cards.length === 4){
            this.pickChoosedCards(this.unmatched_cards[0], this.unmatched_cards[2]);
            return
        }

        if(this.unmatched_cards.length === 2) {
            this.pickChoosedCards(this.unmatched_cards[0], this.unmatched_cards[1]);
            return
        }


        const num1Index = getSecureRandomInt(this.unmatched_cards.length - 1);
        let num2Index = getSecureRandomInt(this.unmatched_cards.length - 1);
        while (num2Index === num1Index) {
            num2Index = getSecureRandomInt(this.unmatched_cards.length - 1);
        }
    
        const index1 = this.unmatched_cards[num1Index];
        const index2 = this.unmatched_cards[num2Index];

        this.pickChoosedCards(index1, index2)
    }

    private chooseCards() {
        const seen: Record<string, number> = {};

        for (let i = 0; i < this.opened_cards.length; i++) {
            const card = this.opened_cards[i];

            if (card.isMatched) continue;

            if (seen[card.imageKey] === undefined) {
                seen[card.imageKey] = i;
            } else {
                this.pickChoosedCards(this.opened_cards[seen[card.imageKey]].id, card.id);
                return;
            }
        }

        this.findRandomIndexesAndPickCards();
    }

    public emit(event: string, data: string) {
        switch (event) {
            case start_memory_game: {
                delay(1000).then(() => {
                    const { currentPlayer }: { currentPlayer: string } = JSON.parse(data);
                    this.currentPlayer = currentPlayer;

                    if (this._id === currentPlayer) {
                        const index1 = getSecureRandomInt(21);
                        let index2 = getSecureRandomInt(21);
                        while (index2 === index1) {
                            index2 = getSecureRandomInt(21);
                        }

                        gameManager.fetchMemoryGameAndPickCard(this.roomId, this.id, index1);
                        delay(1200).then(() => {
                            gameManager.fetchMemoryGameAndPickCard(this.roomId, this.id, index2);
                        });
                    }
                });
                break;
            }

            case open_memory_card: {
                const { cardIndex, imageKey }: { cardIndex: number; imageKey: string } = JSON.parse(data);
                if (!this.opened_cards.some(card => card.id === cardIndex)) {
                    this.opened_cards.push({ id: cardIndex, imageKey, isMatched: false });
                }
                break;
            }

            case match_memory_card: {
                const {card1Index, card2Index, end}: { card1Index: number; card2Index: number; end: boolean }  = JSON.parse(data)
                if(end) return

                for(const card of this.opened_cards){
                    if(card.id === card1Index || card.id === card2Index){
                        card.isMatched = true
                    }
                }
                this.unmatched_cards = this.unmatched_cards.filter(card => card !== card1Index && card !== card2Index)
                this.chooseCards()
                return
            }

            case unmatch_memory_card: {
                delay(1000).then(() => {
                    const {currentTurn}: {currentTurn: string} = JSON.parse(data)
                    this.currentPlayer = currentTurn
    
                    if(currentTurn === this._id){
                        // bot turn pick indexes and run
                        this.chooseCards()
                    }  
                })

                break
                
            }

            case match_memory_card: {
                const { card1Index, card2Index, end }: { card1Index: number; card2Index: number; end: boolean } = JSON.parse(data);
                if (end) return;

                for (const card of this.opened_cards) {
                    if (card.id === card1Index || card.id === card2Index) {
                        card.isMatched = true;
                    }
                }

                if (this._id === this.currentPlayer) {
                    delay(1000).then(() => {
                        this.chooseCards();
                    })
                }
                break;
            }
        }
    }
}
