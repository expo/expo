const defaultOptions = {
  port: 8085,
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
    ws: null,
    server: wss,
  };

  console.log('Starting server', options);
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

// export function stop() {
//   if (!state) {
//     throw new Error('Server is already stopped');
//   }
//   state.ws.close();
//   state = undefined;
// }

export function send(message) {
  if (!state) {
    throw new Error('Server is already stopped');
  }
  state.ws.send(JSON.stringify(message));
}
