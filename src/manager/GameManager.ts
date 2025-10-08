import { IPlayer, IGameRoom, ICoordinate, IBoard } from "../types/game.types";
import { SERVER_CONFIG, SOCKET_EVENTS, ERROR_MESSAGES, GAME_PHASES } from "../utils/constants";
import { IPlaceShipsPayload, IAttackPayload } from '../types/game.types';
import { Socket } from 'socket.io';

class GameManager {
  private static instance: GameManager;
  private matchmakingQueue: IPlayer[] = [];
  private activeRooms: Map<string, IGameRoom> = new Map();
  private playerSessions: Map<string, IPlayer> = new Map();
  private rooms: IGameRoom[] = [];

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

  public processTurn(playerId: string, coordinates: ICoordinate): 'hit' | 'miss' | 'sunk' | 'win' {
    const player = Array.from(this.playerSessions.values()).find(p => p.id === playerId);
    if (!player) {
      throw new Error("Player not found");
    }
    const opponent = Array.from(this.playerSessions.values()).find(p => p.id !== playerId && p.roomId === player.roomId);
    if (!opponent) {
      throw new Error("Opponent not found");
    }

    for (const ship of opponent.ships) {
      for (const pos of ship.positions) {
        if (pos.x === coordinates.x && pos.y === coordinates.y) {
          ship.hits += 1;
          if (ship.hits >= ship.size) {
            ship.isSunk = true;
            if (opponent.ships.every(s => s.isSunk)) {
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

  public handlePlaceShips(socket: Socket, payload: IPlaceShipsPayload, player: IPlayer): void {
    if (!player) {
      this.sendError(socket, ERROR_MESSAGES.PLAYER_NOT_FOUND);
      return;
    }

    const isValid = this.validateShipPlacement(payload.ships);
    if (!isValid) {
      this.sendError(socket, ERROR_MESSAGES.INVALID_SHIP_PLACEMENT);
      return;
    }

    player.ships = payload.ships;
    player.isReady = true;
    const room = this.getRoomByPlayerId(player.id);
    if (room && room.players.every(p => p.isReady)) {
      room.phase = GAME_PHASES.PLAYING;
      this.emitGameStateUpdate(room);
    }
  }

  public handleAttack(socket: Socket, payload: IAttackPayload): void {
    const player = this.getPlayerBySocketId(socket.id);
    if (!player) {
      this.sendError(socket, ERROR_MESSAGES.PLAYER_NOT_FOUND);
      return;
    }

    const room = this.getRoomByPlayerId(player.id);
    if (!room || room.phase !== GAME_PHASES.PLAYING) {
      this.sendError(socket, ERROR_MESSAGES.NOT_YOUR_TURN);
      return;
    }

    const result: 'hit' | 'miss' | 'sunk' | 'win' = this.processTurn(player.id, payload.coordinates);
    this.emitAttackResult(room, player.id, payload.coordinates, result);

    const opponent = room.players.find(p => p.id !== player.id)!;
    const hasWon = this.checkWinCondition(opponent);
    if (hasWon) {
      room.phase = GAME_PHASES.FINISHED;
      this.emitGameOver(room, player.id);
    }
  }

  private sendError(socket: Socket, message: string): void {
    socket.emit(SOCKET_EVENTS.ERROR, { message });
  }

  // Implement missing methods
  private getRoomByPlayerId(playerId: string): IGameRoom | undefined {
    return this.rooms.find((room: IGameRoom) => room.players.some((player: IPlayer) => player.id === playerId));
  }

  private emitGameStateUpdate(room: IGameRoom): void {
    room.players.forEach(player => {
      const playerSession = this.playerSessions.get(player.socketId);
      if (playerSession?.socketId) {
        playerSession.socket.emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { room });
      }
    });
  }

  private emitAttackResult(room: IGameRoom, attackerId: string, coordinates: ICoordinate, result: 'hit' | 'miss' | 'sunk' | 'win'): void {
    room.players.forEach(player => {
      const socket = this.playerSessions.get(player.socketId)?.socket;
      if (socket) {
        socket.emit(SOCKET_EVENTS.ATTACK_RESULT, { attackerId, coordinates, result });
      }
    });
  }

  private emitGameOver(room: IGameRoom, winnerId: string): void {
    room.players.forEach(player => {
      const socket = this.playerSessions.get(player.socketId)?.socket;
      if (socket) {
        socket.emit(SOCKET_EVENTS.GAME_OVER, { winnerId });
      }
    });
  }
}

export default GameManager.getInstance();