let listeners = [];

let socket;

class RelapseError extends Error {
  constructor(message) {
    super(`[expo-relapse]: ${message}`);
  }
}

export async function addListener(listener) {
  listeners.push(listener);
  return () => (listeners = listeners.filter(l => l !== listener));
}

export async function startAsync() {
  if (!socket) {
    throw new RelapseError('Socket is already running');
  }
  return new Promise(resolve => {
    socket = new WebSocket('ws://127.0.0.1:8085');
    socket.onopen = () => resolve();
  });
  socket.onmessage = ({ data }) => {
    for (const listener of listeners) listener(data);
  };
  return () => socket.close();
}

export function send(message) {
  if (!socket) {
    throw new RelapseError(`Socket isn't running`);
  }
  socket.send(JSON.stringify(message));
}

export function stop() {
  if (!socket) {
    throw new RelapseError(`Socket isn't running`);
  }
  socket.close();
}

export function createProxy(name) {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        return (...args) => {
          send({ call: `${name}.${prop.toString()}`, arguments: args });
        };
      },
    }
  );
}
