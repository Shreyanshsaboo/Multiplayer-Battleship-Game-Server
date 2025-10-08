import { Socket } from 'socket.io';
import RoomManager from '../RoomManager';
import CommunicationManager from '../CommunicationManager';

class PlayerConnectionManager {
  private disconnectedPlayers: Map<string, NodeJS.Timeout> = new Map();

  public handleDisconnection(socket: Socket): void {
    const player = RoomManager.getPlayerBySocketId(socket.id);
    if (!player) return;

    console.log(`Player ${player.id} disconnected. Starting timeout.`);

    const timeout = setTimeout(() => {
      console.log(`Player ${player.id} did not reconnect in time. Removing from room.`);
      RoomManager.removePlayerFromRoom(player.id);
    }, 30000); // 30 seconds timeout

    this.disconnectedPlayers.set(player.id, timeout);
  }

  public handleReconnection(socket: Socket, playerId: string): void {
    if (this.disconnectedPlayers.has(playerId)) {
      clearTimeout(this.disconnectedPlayers.get(playerId)!);
      this.disconnectedPlayers.delete(playerId);

      console.log(`Player ${playerId} reconnected.`);
      const room = RoomManager.getRoomByPlayerId(playerId);
      if (room) {
        CommunicationManager.notifyPlayer(socket.id, 'Reconnected to the game.');
        room.players.forEach(p => {
          if (p.id === playerId) {
            p.socket = socket;
          }
        });
      }
    } else {
      console.log(`Player ${playerId} attempted to reconnect but was not found in disconnected players.`);
    }
  }
}

export default new PlayerConnectionManager();