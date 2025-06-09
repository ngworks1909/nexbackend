import { GameType } from "../../zod/GameValidator";
import { LudoGame } from "./game/ludo/LudoGame";
import { MemoryGame } from "./game/memory/MemoryGame";
import { MineGame } from "./game/mines/MineGame";

type Game = LudoGame | MineGame | MemoryGame

class GameManager {
    private static instance: GameManager;
    //map roomId to game
    private games: Map<string, Game> = new Map<string, Game>()

    static getInstance(){
        if(GameManager.instance){
            return GameManager.instance;
        }
        GameManager.instance = new GameManager();
        return GameManager.instance;
    }
    public createGame(roomId: string, gameType: GameType){
        switch(gameType){
            case "LUDO":
                this.games.set(roomId, new LudoGame(roomId))
                break;
            case "MINES":
                this.games.set(roomId, new MineGame(roomId))
                break;
            case "MEMORY":
                this.games.set(roomId, new MemoryGame(roomId))
                break;
            default:
                break;
        }
    }

    public fetchMinesGameAndPickCard(roomId: string, cardIndex: number){
        const game = this.games.get(roomId);
        if(!game) return;
        if(!(game instanceof MineGame)) return
        if(game.gameOver) return;
        game.pickCard(cardIndex)
    }

    public fetchMinesGameAndClaim(roomId: string){
        const game = this.games.get(roomId);
        if(!game) return;
        if(!(game instanceof MineGame)) return
        if(game.gameOver) return;
        game.claimAmount()
    }


    public fetchMemoryGameAndPickCard(roomId: string, playerId: string, cardIndex: number){
        const game = this.games.get(roomId);
        if(!game) return;
        if(!(game instanceof MemoryGame)) return
        if(game.gameOver) return;
        game.pickCard(playerId, cardIndex)
    }


    public fetchLudoGameAndRollDice(roomId: string, playerId: string){
        const game = this.games.get(roomId);
        if(!game) return;
        if(!(game instanceof LudoGame)) return
        if(game.gameOver) return;
        game.rollDice(playerId)
    }

    public fetchLudoGameAndMovePiece(roomId: string, playerId: string, pieceId: string){
        const game = this.games.get(roomId);
        if(!game) return;
        if(!(game instanceof LudoGame)) return
        if(game.gameOver) return;
        game.movePiece(playerId, pieceId)
    }

    





}

export const gameManager = GameManager.getInstance();