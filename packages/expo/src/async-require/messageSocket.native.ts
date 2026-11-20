/* eslint-env browser */
import getDevServer from '../utils/getDevServer';

declare namespace globalThis {
  let __EXPO_RSC_RELOAD_LISTENERS__: (() => unknown)[] | undefined;
}

function connect(): WebSocket | null {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    console.warn('Cannot create devtools websocket connections in embedded environments');
    return null;
  }

  const devServerUrl = new URL(devServer.url);
  const serverScheme = devServerUrl.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${serverScheme}://${devServerUrl.host}/message`);
  socket.onmessage = (message: { data: any }) => {
    const data = JSON.parse(String(message.data));
    switch (data.method) {
      case 'sendDevCommand':
        switch (data.params.name) {
          case 'rsc-reload':
            if (data.params.platform && data.params.platform !== process.env.EXPO_OS) {
              return;
            }
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__?.forEach((l) => l());
            break;
        }
        break;
      // NOTE: All other cases are handled in the native runtime.
    }
  };
  return socket;
}

if (__DEV__) {
  let socket: WebSocket | null = null;
  let listeners: (() => unknown)[] | undefined;

  // The socket carries only `rsc-reload`, so it opens when React Server Components registers its
  // first reload listener. React Native DevTools lists every JS WebSocket, and an app without RSC
  // would otherwise show this one.
  Object.defineProperty(globalThis, '__EXPO_RSC_RELOAD_LISTENERS__', {
    configurable: true,
    get: () => listeners,
    set(value: (() => unknown)[] | undefined) {
      listeners = value;
      if (value && !socket) {
        socket = connect();
      }
    },
  });
}
