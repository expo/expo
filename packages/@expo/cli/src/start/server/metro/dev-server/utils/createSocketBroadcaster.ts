import type { RawData as WebSocketRawData } from 'ws';

import type { SocketId, SocketMap } from './createSocketMap';

const debug = require('debug')('expo:metro:dev-server:broadcaster') as typeof console.log;

export function createBroadcaster(sockets: SocketMap) {
  return function broadcast(senderSocketId: SocketId | null, message: string | WebSocketRawData) {
    // Ignore if there are no connected sockets
    if (!sockets.size) return;

    for (const [socketId, socket] of sockets) {
      if (socketId === senderSocketId) continue;

      try {
        socket.send(message);
      } catch (error) {
        debug(`Failed to broadcast message to socket "${socketId}"`, error);
      }
    }
  };
}
