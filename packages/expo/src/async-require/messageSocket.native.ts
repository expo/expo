/* eslint-env browser */
import getDevServer from './getDevServer';

declare namespace globalThis {
  const __EXPO_RSC_RELOAD_LISTENERS__: (() => unknown)[] | undefined;
}

if (__DEV__) {
  const socket: WebSocket = (() => {
    const devServer = getDevServer();
    if (!devServer.bundleLoadedFromServer) {
      throw new Error('Cannot create devtools websocket connections in embedded environments.');
    }

    const devServerUrl = new URL(devServer.url);
    const serverScheme = devServerUrl.protocol === 'https:' ? 'wss' : 'ws';
    return new WebSocket(`${serverScheme}://${devServerUrl.host}/message`);
  })();

  socket.onmessage = (message: { data: any }) => {
    const data = JSON.parse(String(message.data));
    switch (data.method) {
      case 'sendDevCommand':
        switch (data.params.name) {
          case 'rsc-reload':
            if (data.params.platform && data.params.platform !== process.env.EXPO_OS) {
              return;
            }
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
}
