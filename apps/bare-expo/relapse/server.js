import connect from 'connect';
import http from 'http';
import bodyParser from 'body-parser';

export const jestExpect = require('expect');

const defaultOptions = {
  port: 62556,
};

// all state is contained in this variable
let state;

const WebSocket = require('ws');

export function startAsync(startOptions = {}) {
  if (state) {
    throw new Error('Server is already started');
  }
  const options = Object.assign({}, defaultOptions, startOptions);

  const wss = new WebSocket.Server({ port: defaultOptions.port });
  wss.on('connection', ws => {
    ws.on('message', message => {
      const body = JSON.parse(message);
      options.onEvent && options.onEvent(body.call, body.arguments || []);

      // console.log(`Received message => ${message}`);
    });
    state.ws = ws;
  });

  state = {
    server: wss,
  };

  console.log('Starting server', options);
}

export function stop() {
  if (!state) {
    throw new Error('Server is already stopped');
  }
  state.server.close();
  state = undefined;
}

export function send(message) {
  if (!state) {
    throw new Error('Server is already stopped');
  }
  state.ws.send(JSON.stringify(message));
}
