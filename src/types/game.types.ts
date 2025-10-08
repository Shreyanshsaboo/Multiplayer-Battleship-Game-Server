import { CELL_STATES, GAME_PHASES, SHIPS } from "../utils/constants";
import { Socket } from 'socket.io';

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];
export type CellState = typeof CELL_STATES[keyof typeof CELL_STATES];
export type ShipState = typeof SHIPS[keyof typeof SHIPS];

export interface IPlayer {
  id: string;
  socketId: string;
  name: string;
  roomId: string;
  board: IBoard;
  isReady: boolean;
  ships: IShip[];
  isAlive: boolean;
  socket: Socket;
}

export interface IGameRoom{
  id: string;
  players: [IPlayer,IPlayer];
  currentTurn: string | null;
  phase: GamePhase;
  winner: string | null;
  turnTimer: NodeJS.Timeout | null;
  createdAt: number;
}

export interface IBoard {
  grid: CellState[][];
}

export interface ICoordinate {
  x: number;
  y: number;
}

export interface IShip{
  type: ShipState,
  size: number,
  positions: ICoordinate[]; // Array of coordinates
  hits: number;
  isSunk: boolean;
}

export interface IAttack{
  coordinates: ICoordinate;
  result: 'hit' | 'miss' | 'sunk';
}

export interface IJoinGamePayload{
  name: string;
  roomId: string;
  isSpectator: boolean;
}

export interface IPlaceShipsPayload{
  ships: IShip[];
}

export interface IAttackPayload{
  coordinates: ICoordinate;
}

export interface IErrorPayload{
  message: string;
}

export interface IGameStatePayload{
  room: IGameRoom;
  yourId: string;
}
