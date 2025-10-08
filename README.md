# Multiplayer Battleship Game Server

A high-performance, scalable multiplayer Battleship game server built with Node.js, TypeScript, and Socket.IO. This project enables real-time, low-latency gameplay and robust player interactions.

## Features
- Real-time multiplayer gameplay using WebSocket communication
- Modular, domain-driven architecture for maintainability and scalability
- Dedicated managers for matchmaking, game state, communication, and player connections
- Production-ready middleware: Helmet (security), Morgan (logging), rate limiting (DDoS mitigation)
- Graceful shutdown and robust error handling
- Comprehensive unit tests with Jest

## Technologies Used
- Node.js
- TypeScript
- Socket.IO
- Express
- Morgan, Helmet, express-rate-limit
- Jest

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
```bash
npm install
```

### Running the Server
```bash
npm run build
npm start
```

The server will start on the port specified in `SERVER_CONFIG` (default: 3000).

### Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

## Project Structure
```
src/
  manager/
    GameManager.ts
    MatchmakingManager.ts
    RoomManager.ts
    GameLogicManager.ts
    CommunicationManager.ts
    GameStateManager.ts
    PlayerConnectionManager.ts
  utils/
    constants.ts
  server.ts
```

## API & Socket Events
- `JOIN_GAME`: Add player to matchmaking queue
- `MESSAGE`: Send in-game messages
- `RECONNECT`: Handle player reconnection
- `disconnect`: Handle player disconnection
- `ERROR`: Error notifications

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
