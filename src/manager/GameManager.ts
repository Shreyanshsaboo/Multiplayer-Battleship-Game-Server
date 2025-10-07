import { IPlayer, IGameRoom, ICoordinate } from "../types/game.types";
import { SERVER_CONFIG } from "../utils/constants";

class GameManager {
  private static instance: GameManager;
  private matchmakingQueue: IPlayer[] = [];
  private activeRooms: Map<string, IGameRoom> = new Map();
  private playerSessions: Map<string, IPlayer> = new Map();


  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public addPlayerToQueue(player: IPlayer): void {
    const alreadyInQueue = this.matchmakingQueue.find(p => p.id === player.id);
    if (!alreadyInQueue) {
      this.matchmakingQueue.push(player);
      this.playerSessions.set(player.socketId, player);
    }
  }

  public removePlayer(socketId: string): void {
    this.matchmakingQueue = this.matchmakingQueue.filter(p => p.socketId !== socketId);
    this.playerSessions.delete(socketId);
  }

  public tryCreateMatch(): void {
    if (this.matchmakingQueue.length >= 2 && this.isRoomAvailable()) {
      const player1 = this.matchmakingQueue.shift()!;
      const player2 = this.matchmakingQueue.shift()!;
      const room = this.createGameRoom(player1, player2);
      this.activeRooms.set(room.id, room);
    }
  }

  private createGameRoom(player1: IPlayer, player2: IPlayer): IGameRoom {
    const roomId = this.generateRoomId();
    const newRoom: IGameRoom = {
      id: roomId,
      players: [player1, player2],
      currentTurn: null,
      phase: 'setup',
      winner: null,
      turnTimer: null,
      createdAt: Date.now()
    };
    player1.roomId = roomId;
    player2.roomId = roomId;
    return newRoom;
  }
  private isRoomAvailable(): boolean {
    return this.activeRooms.size < SERVER_CONFIG.MAX_CONCURRENT_ROOMS;
  }

  private generateRoomId(): string {
    return 'room-' + Math.random().toString(36).substr(2, 9);
  }

  public getPlayerBySocketId(socketId: string): IPlayer | undefined {
    return this.playerSessions.get(socketId);
  }

  private cleanupRoom(roomId: string): void {
    this.activeRooms.delete(roomId);
    setTimeout(() => {
    }, SERVER_CONFIG.ROOM_COOLDOWN_TIME); 
  }

  public validateShipPlacement(ships: IPlayer['ships']): boolean {

    const occupiedPositions = new Set<string>();
    
    for (const ship of ships) {
      if (ship.positions.length !== ship.size) {
        return false; 
      }

      for (const pos of ship.positions) {
        const posKey = `${pos.x},${pos.y}`;
        if (occupiedPositions.has(posKey)) {
          return false;
        }
        occupiedPositions.add(posKey);
      }
    }

    return true;
  }

  public processTurn(playerId:string, coordinates: ICoordinate): string{
    const player = Array.from(this.playerSessions.values()).find(p => p.id === playerId);
    if(!player){
      throw new Error("Player not found");
    }
    const opponent = Array.from(this.playerSessions.values()).find(p => p.id !== playerId && p.roomId === player.roomId);
    if(!opponent){
      throw new Error("Opponent not found");
    }

    for(const ship of opponent.ships){
      for(const pos of ship.positions){
        if(pos.x === coordinates.x && pos.y === coordinates.y){
          ship.hits += 1;
          if(ship.hits >= ship.size){
            ship.isSunk = true;
            if(opponent.ships.every(s => s.isSunk)){
              player.isAlive = false;
              return 'win';
            }
            return 'sunk';
          }
          return 'hit';
        }
      }
    }
    return 'miss';
  }

  public checkWinCondition(player: IPlayer): boolean {
    return player.ships.every(ship => ship.isSunk);
  }


}

export default GameManager.getInstance();