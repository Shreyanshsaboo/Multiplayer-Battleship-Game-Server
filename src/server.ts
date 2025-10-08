import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import GameManager from './manager/GameManager';
import { SERVER_CONFIG, SOCKET_EVENTS } from './utils/constants';

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.JOIN_GAME, (payload) => {
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
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    GameManager.removePlayer(socket.id);
  });
});

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server listening on port ${SERVER_CONFIG.PORT}`);
});

export default server;
