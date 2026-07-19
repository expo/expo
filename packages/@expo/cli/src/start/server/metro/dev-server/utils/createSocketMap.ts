import type { WebSocket } from 'ws';

import { event } from '../../hmrEvents';

export type SocketId = string;
export type SocketMap = Map<string, WebSocket>;

export function createSocketMap() {
  const map: SocketMap = new Map();
  const createId = createSocketIdFactory();

  const registerSocket = (socket: WebSocket) => {
    const id = createId();
    map.set(id, socket);
    return {
      id,
      terminate: () => {
        map.delete(id);
        socket.removeAllListeners();
        socket.terminate();
      },
    };
  };

  const findSocket = (id: SocketId): WebSocket | null => {
    const socket = map.get(id);
    if (!socket) event('socket_not_found', { id });
    return socket ?? null;
  };

  return { map, registerSocket, findSocket };
}

function createSocketIdFactory() {
  let nextId = 0;
  return () => `socket#${nextId++}`;
}
