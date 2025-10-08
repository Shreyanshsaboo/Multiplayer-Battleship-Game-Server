import { IGameRoom, IPlayer } from '../types/game.types';

class RoomManager {
  private activeRooms: Map<string, IGameRoom> = new Map();

  public createGameRoom(player1: IPlayer, player2: IPlayer): IGameRoom {
    const roomId = 'room-' + Math.random().toString(36).substr(2, 9);
    const newRoom: IGameRoom = {
      id: roomId,
      players: [player1, player2],
      currentTurn: null,
      phase: 'setup',
      winner: null,
      turnTimer: null,
      createdAt: Date.now()
    };
    this.activeRooms.set(roomId, newRoom);
    return newRoom;
  }

  public cleanupRoom(roomId: string): void {
    this.activeRooms.delete(roomId);
  }

  public getActiveRooms(): Map<string, IGameRoom> {
    return this.activeRooms;
  }

  public getPlayerBySocketId(socketId: string): IPlayer | undefined {
    for (const room of this.activeRooms.values()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) return player;
    }
    return undefined;
  }

  public getRoomByPlayerId(playerId: string): IGameRoom | undefined {
    for (const room of this.activeRooms.values()) {
      if (room.players.some(p => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }
}

export default new RoomManager();