/* eslint-env browser */

function createWebSocketConnection(path: string = '/message') {
  const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer');
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error('Cannot create devtools websocket connections in embedded environments.');
  }

  const devServerUrl = new URL(devServer.url);
  const serverScheme = devServerUrl.protocol === 'https:' ? 'wss' : 'ws';
  const WebSocket = require('react-native/Libraries/WebSocket/WebSocket');
  return new WebSocket(`${serverScheme}://${devServerUrl.host}${path}`);
}

createWebSocketConnection().onmessage = (message) => {
  const data = JSON.parse(String(message.data));
  switch (data.method) {
    case 'sendDevCommand':
      switch (data.params.name) {
        case 'rsc-reload':
          if (data.params.platform && data.params.platform !== process.env.EXPO_OS) {
            return;
          }
          console.log(
            'HMR(Client): Reload received from server. Sending to listeners:',
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__?.length
          );
          if (!globalThis.__EXPO_RSC_RELOAD_LISTENERS__) {
            // server function-only mode
          } else {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__?.forEach((l) => l());
          }
          break;
      }
      break;
    // NOTE: All other cases are handled in the native runtime.
  }
};
