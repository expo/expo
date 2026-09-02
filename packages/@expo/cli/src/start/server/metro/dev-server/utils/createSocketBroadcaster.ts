import { event } from '../../hmrEvents';
import type { SocketId, SocketMap } from './createSocketMap';

export function createBroadcaster(sockets: SocketMap) {
  return function broadcast(senderSocketId: SocketId | null, message: string) {
    // Ignore if there are no connected sockets
    if (!sockets.size) return;

    for (const [socketId, socket] of sockets) {
      if (socketId === senderSocketId) continue;

      try {
        socket.send(message);
      } catch (error) {
        event('broadcast_failed', { socketId, error: event.error(error as Error) });
      }
    }
  };
}
