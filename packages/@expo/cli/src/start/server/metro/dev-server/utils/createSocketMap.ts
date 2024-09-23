import type { WebSocket } from 'ws';

const debug = require('debug')('expo:metro:dev-server:socketmap') as typeof console.log;

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
    if (!socket) debug(`No connected socket found with ID: ${id}`);
    return socket ?? null;
  };

  return { map, registerSocket, findSocket };
}

function createSocketIdFactory() {
  let nextId = 0;
  return () => `socket#${nextId++}`;
}
