import chalk from 'chalk';
import { WebSocketServer } from 'ws';

import { createHandlersFactory } from './createHandlersFactory';
import { Log } from '../../../../log';
import { env } from '../../../../utils/env';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { NETWORK_RESPONSE_STORAGE } from './messageHandlers/NetworkResponse';

const debug = require('debug')('expo:metro:debugging:middleware') as typeof console.log;

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
  // Load the React Native debugging tools from project
  // TODO: check if this works with isolated modules
  const { createDevMiddleware } =
    require('@react-native/dev-middleware') as typeof import('@react-native/dev-middleware');

  const { middleware, websocketEndpoints } = createDevMiddleware({
    projectRoot: metroBundler.projectRoot,
    serverBaseUrl: metroBundler.getUrlCreator().constructUrl({ scheme: 'http', hostType: 'lan' }),
    logger: createLogger(chalk.bold('Debug:')),
    unstable_customInspectorMessageHandler: createHandlersFactory(),
    unstable_experiments: {
      // Enable the Network tab in React Native DevTools
      enableNetworkInspector: true,
      // Only enable opening the browser version of React Native DevTools when debugging.
      // This is useful when debugging the React Native DevTools by going to `/open-debugger` in the browser.
      enableOpenDebuggerRedirect: env.EXPO_DEBUG,
    },
  });

  // NOTE(cedric): add a temporary websocket to handle Network-related CDP events
  websocketEndpoints['/inspector/network'] = createNetworkWebsocket(
    websocketEndpoints['/inspector/debug']
  );

  return {
    debugMiddleware: middleware,
    debugWebsocketEndpoints: websocketEndpoints,
  };
}

function createLogger(
  logPrefix: string
): Parameters<typeof import('@react-native/dev-middleware').createDevMiddleware>[0]['logger'] {
  return {
    info: (...args) => Log.log(logPrefix, ...args),
    warn: (...args) => Log.warn(logPrefix, ...args),
    error: (...args) => Log.error(logPrefix, ...args),
  };
}

/**
 * This adds a dedicated websocket connection that handles Network-related CDP events.
 * It's a temporary solution until Fusebox either implements the Network CDP domain,
 * or allows external domain agents that can send messages over the CDP socket to the debugger.
 * The Network websocket rebroadcasts events on the debugger CDP connections.
 */
function createNetworkWebsocket(debuggerWebsocket: WebSocketServer) {
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: true,
    // Don't crash on exceptionally large messages - assume the device is
    // well-behaved and the debugger is prepared to handle large messages.
    maxPayload: 0,
  });

  wss.on('connection', (networkSocket) => {
    networkSocket.on('message', (data) => {
      try {
        // Parse the network message, to determine how the message should be handled
        const message = JSON.parse(data.toString());

        if (message.method === 'Expo(Network.receivedResponseBody)' && message.params) {
          // If its a response body, write it to the global storage
          const { requestId, ...requestInfo } = message.params;
          NETWORK_RESPONSE_STORAGE.set(requestId, requestInfo);
        } else {
          // Otherwise, directly re-broadcast the Network events to all connected debuggers
          debuggerWebsocket.clients.forEach((debuggerSocket) => {
            if (debuggerSocket.readyState === debuggerSocket.OPEN) {
              debuggerSocket.send(data.toString());
            }
          });
        }
      } catch (error) {
        debug('Failed to handle Network CDP event', error);
      }
    });
  });

  return wss;
}
