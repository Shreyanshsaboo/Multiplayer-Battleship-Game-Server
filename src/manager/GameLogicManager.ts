import { ICoordinate, IPlayer, IShip } from '../types/game.types';

class GameLogicManager {
  public processTurn(player: IPlayer, coordinates: ICoordinate): 'hit' | 'miss' | 'sunk' | 'win' {
    const opponent = player.opponent;
    if (!opponent) {
      throw new Error("Opponent not found");
    }
    for (const ship of opponent.ships) {
      for (const pos of ship.positions) {
        if (pos.x === coordinates.x && pos.y === coordinates.y) {
          ship.hits += 1;
          if (ship.hits >= ship.size) {
            ship.isSunk = true;
            if (opponent.ships.every((s: IShip) => s.isSunk)) {
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

export default new GameLogicManager();