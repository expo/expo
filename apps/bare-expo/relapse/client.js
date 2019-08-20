import RelapseError from './RelapseError';

let listeners = [];

let socket;

export async function addListener(listener) {
  listeners.push(listener);
  return () => (listeners = listeners.filter(l => l !== listener));
}

export async function startAsync() {
  if (socket) {
    console.warn('Socket is already running');
    return () => socket.close();
  }
  await new Promise(resolve => {
    socket = new WebSocket('ws://127.0.0.1:8085');
    socket.onopen = () => resolve();
  });
  socket.onmessage = ({ data }) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      parsed = data;
    } finally {
      for (const listener of listeners) listener(parsed);
    }
  };
  return () => socket.close();
}

export function send(message) {
  if (!socket) {
    throw new RelapseError(`server`, `Socket isn't running`);
  }
  socket.send(JSON.stringify(message));
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
