import { EventEmitter } from 'events';

export type GameState = 'waiting' | 'in-progress' | 'finished';

class GameStateManager {
  private state: GameState = 'waiting';
  private eventEmitter = new EventEmitter();

  public setGameState(state: GameState): void {
    if (!this.isValidTransition(this.state, state)) {
      console.error(`Invalid state transition from ${this.state} to ${state}`);
      return;
    }

    console.log(`Game state changing from ${this.state} to ${state}`);
    this.state = state;
    this.eventEmitter.emit('stateChange', state);
  }

  public getGameState(): GameState {
    return this.state;
  }

  public onStateChange(listener: (state: GameState) => void): void {
    this.eventEmitter.on('stateChange', listener);
  }

  private isValidTransition(from: GameState, to: GameState): boolean {
    const validTransitions: Record<GameState, GameState[]> = {
      waiting: ['in-progress'],
      'in-progress': ['finished'],
      finished: ['waiting'],
    };

    return validTransitions[from].includes(to);
  }
}

export default new GameStateManager();