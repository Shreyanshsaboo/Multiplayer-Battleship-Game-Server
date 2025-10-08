import { IPlayer, IGameRoom, ICoordinate, IBoard } from "../types/game.types";
import { SERVER_CONFIG, SOCKET_EVENTS, ERROR_MESSAGES, GAME_PHASES } from "../utils/constants";
import { IPlaceShipsPayload, IAttackPayload } from '../types/game.types';
import { Socket } from 'socket.io';
import MatchmakingManager from './MatchmakingManager';
import RoomManager from './RoomManager';
import GameLogicManager from './GameLogicManager';
import CommunicationManager from './CommunicationManager';
import GameStateManager from './GameStateManager/GameStateManager';

class GameManager {
  private static instance: GameManager;
  private roomManager = RoomManager;
  private communicationManager = CommunicationManager;
  private gameState: 'waiting' | 'in-progress' | 'finished' = 'waiting';

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public setGameState(state: 'waiting' | 'in-progress' | 'finished'): void {
    this.gameState = state;
  }

  public getGameState(): 'waiting' | 'in-progress' | 'finished' {
    return this.gameState;
  }

  public addPlayerToQueue(player: IPlayer): void {
    MatchmakingManager.addPlayerToQueue(player);
  }

  public tryCreateMatch(): void {
    if (GameStateManager.getGameState() !== 'waiting') {
      console.error('Cannot create a match unless the game is in the waiting state.');
      return;
    }

    if (MatchmakingManager.tryCreateMatch()) {
      const player1 = MatchmakingManager.getQueue().shift()!;
      const player2 = MatchmakingManager.getQueue().shift()!;
      const room = RoomManager.createGameRoom(player1, player2);
      RoomManager.getActiveRooms().set(room.id, room);
      GameStateManager.setGameState('in-progress');
    }
  }

  public handleAttack(socket: Socket, payload: IAttackPayload): void {
    if (GameStateManager.getGameState() !== 'in-progress') {
      CommunicationManager.sendError(socket, 'Game is not in progress.');
      return;
    }

    const player = RoomManager.getPlayerBySocketId(socket.id);
    if (!player) {
      CommunicationManager.sendError(socket, ERROR_MESSAGES.PLAYER_NOT_FOUND);
      return;
    }

    const room = RoomManager.getRoomByPlayerId(player.id);
    if (!room || room.phase !== GAME_PHASES.PLAYING) {
      CommunicationManager.sendError(socket, ERROR_MESSAGES.NOT_YOUR_TURN);
      return;
    }

    const result = GameLogicManager.processTurn(player, payload.coordinates);
    CommunicationManager.emitAttackResult(room, player.id, payload.coordinates, result);

    const opponent = room.players.find(p => p.id !== player.id)!;
    if (GameLogicManager['checkWinCondition'](opponent)) {
      room.phase = GAME_PHASES.FINISHED;
      CommunicationManager.emitGameOver(room, player.id);
      this.setGameState('finished');
    }
  }

  public handleMessage(socket: Socket, recipientId: string, message: string): void {
    CommunicationManager.handleMessage(socket, RoomManager.getPlayerBySocketId(recipientId)?.socket!, message);
  }

  public broadcastMessage(roomId: string, message: string): void {
    CommunicationManager.broadcastMessage(RoomManager.getActiveRooms().get(roomId)?.players.map(p => p.socket)!, message);
  }

  public removePlayer(socketId: string): void {
    MatchmakingManager.getQueue().filter(p => p.socketId !== socketId);
    RoomManager.getActiveRooms().forEach((room) => {
      const updatedPlayers = room.players.filter(player => player.socketId !== socketId);
      if (updatedPlayers.length === 1) {
        this.roomManager.cleanupRoom(room.id);
        this.communicationManager.notifyPlayer(updatedPlayers[0].socketId, 'Your opponent has left the game.');
      } else if (updatedPlayers.length === 0) {
        this.roomManager.cleanupRoom(room.id);
      }
    });
  }
}

export default GameManager.getInstance();