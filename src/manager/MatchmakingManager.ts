import { IPlayer } from '../types/game.types';
import { SERVER_CONFIG } from '../utils/constants';

class MatchmakingManager {
  private matchmakingQueue: IPlayer[] = [];

  public addPlayerToQueue(player: IPlayer): void {
    const alreadyInQueue = this.matchmakingQueue.find(p => p.id === player.id);
    if (!alreadyInQueue) {
      this.matchmakingQueue.push(player);
    }
  }

  public tryCreateMatch(): boolean {
    return this.matchmakingQueue.length >= 2 && this.matchmakingQueue.length < SERVER_CONFIG.MAX_CONCURRENT_ROOMS;
  }

  public getQueue(): IPlayer[] {
    return this.matchmakingQueue;
  }
}

export default new MatchmakingManager();