import GameManager from '../manager/GameManager';
import GameStateManager from '../manager/GameStateManager/GameStateManager';

describe('GameManager', () => {
  beforeEach(() => {
    GameStateManager.setGameState('waiting');
  });

  test('should create a match when in waiting state', () => {
    GameManager.tryCreateMatch();
    expect(GameStateManager.getGameState()).toBe('in-progress');
  });

  test('should not create a match when not in waiting state', () => {
    GameStateManager.setGameState('in-progress');
    GameManager.tryCreateMatch();
    expect(GameStateManager.getGameState()).toBe('in-progress');
  });

  test('should handle attack only in in-progress state', () => {
    GameStateManager.setGameState('waiting');
    const mockSocket = { id: 'mockSocketId' } as any;
    const mockPayload = { coordinates: { x: 1, y: 1 } };

    expect(() => GameManager.handleAttack(mockSocket, mockPayload)).not.toThrow();
  });
});