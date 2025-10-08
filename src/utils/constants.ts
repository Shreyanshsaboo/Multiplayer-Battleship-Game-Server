/**
 * @fileoverview Game Configuration Constants
 * @description Centralizes all game rules, timing, and server configuration
 * @author Shreyansh Saboo
 */

/**
 * Ship types and sizes according to standard Battleship rules
 */
const SHIPS = {
  CARRIER: 5,
  BATTLESHIP: 4,
  CRUISER: 3,
  SUBMARINE: 3,
  DESTROYER: 2
} as const;

/**
 * Game phases representing the current state of a game
 */
const GAME_PHASES = {
  WAITING_FOR_PLAYERS: 'waiting_for_players',
  SETUP: 'setup', // Ship placement phase
  PLAYING: 'playing',
  FINISHED: 'finished'
} as const;

/**
 * Server configuration and capacity limits
 */
const SERVER_CONFIG = {
  PORT: 3001,
  MAX_CONCURRENT_ROOMS: 3, // Maximum simultaneous games
  MAX_PLAYERS_PER_ROOM: 2,
  ROOM_COOLDOWN_TIME: 5000, // in milliseconds
  TURN_TIMEOUT: 30000 // in milliseconds
} as const;

/**
 * Game board configuration
 */
const BOARD_CONFIG = {
  SIZE: 10, // 10x10 grid
  COORDINATE_RANGE: { min: 0, max: 9 } // x,y from 0-9
} as const;

/**
 * Possible states for each cell on the game board
 */

const CELL_STATES = {
  EMPTY: 'empty',
  SHIP: 'ship',
  HIT: 'hit',
  MISS: 'miss',
  SUNK: 'sunk'
} as const;

/**
 * Socket.IO event names for client-server communication
 */
const SOCKET_EVENTS = {
  JOIN_GAME: 'join_game',
  PLACE_SHIPS: 'place_ships',
  ATTACK: 'attack',
  ATTACK_RESULT: 'attack_result',
  MATCH_FOUND: 'match-found',
  WAITING_FOR_OPPONENT: 'waiting-for-opponent',
  GAME_STATE_UPDATE: 'game-state-update',
  TURN_TIMEOUT: 'turn-timeout',
  GAME_OVER: 'game-over',
  ERROR: 'error',
  MESSAGE: 'message',
  BROADCAST: 'broadcast',
  NOTIFICATION: 'notification',
  RECONNECT: 'reconnect'
} as const;

/**
 * Standard error messages for consistent user feedback
 */
const ERROR_MESSAGES = {
  INVALID_COORDINATES: 'Invalid coordinates provided',
  INVALID_SHIP_PLACEMENT: 'Invalid ship placement',
  NOT_YOUR_TURN: 'It is not your turn',
  GAME_FULL: 'Server is at capacity',
  PLAYER_NOT_FOUND: 'Player not found',
  ROOM_NOT_FOUND: 'Game room not found',
  RECIPIENT_NOT_FOUND: 'Recipient not found'
} as const;

export {
  SHIPS,
  GAME_PHASES,
  SERVER_CONFIG,
  BOARD_CONFIG,
  CELL_STATES,
  SOCKET_EVENTS,
  ERROR_MESSAGES
};
