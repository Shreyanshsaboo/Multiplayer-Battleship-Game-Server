import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../utils/constants';
import { IGameRoom, ICoordinate, IPlayer } from '../types/game.types';

class CommunicationManager {
  public handleMessage(socket: Socket, recipientSocket: Socket, message: string): void {
    recipientSocket.emit(SOCKET_EVENTS.MESSAGE, { senderId: socket.id, message });
  }

  public broadcastMessage(roomSockets: Socket[], message: string): void {
    roomSockets.forEach(socket => {
      socket.emit(SOCKET_EVENTS.BROADCAST, { message });
    });
  }

  public sendError(socket: Socket, message: string): void {
    socket.emit(SOCKET_EVENTS.ERROR, { message });
  }

  public emitAttackResult(room: IGameRoom, attackerId: string, coordinates: ICoordinate, result: 'hit' | 'miss' | 'sunk' | 'win'): void {
    room.players.forEach((player: IPlayer) => {
      const socket = player.socket;
      if (socket) {
        socket.emit(SOCKET_EVENTS.ATTACK_RESULT, { attackerId, coordinates, result });
      }
    });
  }

  public emitGameOver(room: IGameRoom, winnerId: string): void {
    room.players.forEach((player: IPlayer) => {
      const socket = player.socket;
      if (socket) {
        socket.emit(SOCKET_EVENTS.GAME_OVER, { winnerId });
      }
    });
  }

  public notifyPlayer(socketId: string, message: string): void {
    const socket = this.getSocketById(socketId);
    if (socket) {
      socket.emit(SOCKET_EVENTS.NOTIFICATION, { message });
    }
  }

  private getSocketById(socketId: string): Socket | undefined {
    // Implement logic to retrieve the socket by its ID
    return undefined; // Placeholder implementation
  }
}

export default new CommunicationManager();