import WebSocket from 'ws';

import RelapseError from './RelapseError';
import { RelapseCode } from './protocol';

const defaultOptions = {
  port: 8085,
};

let state;

export async function startAsync(startOptions = {}) {
  if (state) {
    throw new RelapseError(`server`, 'Server is already started');
  }
  const options = { ...defaultOptions, ...startOptions };

  const wss = new WebSocket.Server({ port: options.port });

  state = {
    ws: null,
    server: wss,
  };

  wss.on('connection', ws => {
    ws.on('message', message => {
      const body = JSON.parse(message);
      if (body.code === RelapseCode.SerializationError) {
        console.error(`Client failed to serialize the arguments for a call to ${body.call}`);
      } else if (body.code === RelapseCode.ProxyCall) {
        if (!Array.isArray(body.arguments)) {
          console.error(
            `Proxied invocation of ${body.call} from the client did not send an array of arguments:`,
            body.arguments
          );
        } else {
          options.onEvent && options.onEvent(body.call, body.arguments);
        }
      }
    });
    state.ws = ws;
    startOptions.onConnect && startOptions.onConnect(ws);
  });

  return async () => {
    if (state.ws) state.ws.close();
    return new Promise((resolve, reject) =>
      wss.close(error => {
        if (error) reject(error);
        else resolve();
      })
    );
  };
}

export function send(message) {
  if (!state || !state.ws) {
    throw new RelapseError(`server`, 'Server cannot send data');
  }
  state.ws.send(JSON.stringify(message));
}
