import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import GameManager from './manager/GameManager';
import PlayerConnectionManager from './manager/PlayerConnectionManager/PlayerConnectionManager';
import { SERVER_CONFIG, SOCKET_EVENTS } from './utils/constants';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.JOIN_GAME, (payload) => {
    try {
      GameManager.addPlayerToQueue({
        id: payload.id,
        socketId: socket.id,
        name: payload.name || 'Player',
        roomId: '',
        board: { grid: [] },
        isReady: false,
        ships: [],
        isAlive: true,
        socket
      });
      GameManager.tryCreateMatch();
    } catch (error) {
      const err = error as Error;
      console.error(`Error in JOIN_GAME: ${err.message}`);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join game.' });
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE, ({ recipientId, message }) => {
    try {
      GameManager.handleMessage(socket, recipientId, message);
    } catch (error) {
      const err = error as Error;
      console.error(`Error in MESSAGE: ${err.message}`);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message.' });
    }
  });

  socket.on(SOCKET_EVENTS.RECONNECT, (payload) => {
    try {
      PlayerConnectionManager.handleReconnection(socket, payload.playerId);
    } catch (error) {
      const err = error as Error;
      console.error(`Error in RECONNECT: ${err.message}`);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to reconnect.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    PlayerConnectionManager.handleDisconnection(socket);
  });
});

// Graceful Shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  io.close(() => {
    console.log('WebSocket server closed.');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server listening on port ${SERVER_CONFIG.PORT}`);
});
