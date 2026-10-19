import type { NextHandleFunction } from 'connect';
import { WebSocketServer } from 'ws';

import { env, envIsHeadless } from '../../../../utils/env';
import { isLocalSocket, isMatchingOrigin } from '../../../../utils/net';
import type { TerminalReporter } from '../TerminalReporter';
import { event } from '../inspectorEvents';
import { createHandlersFactory } from './createHandlersFactory';
import { recordNetworkResponse } from './messageHandlers/NetworkResponse';

interface DebugMiddleware {
  debugMiddleware: NextHandleFunction;
  debugWebsocketEndpoints: Record<string, WebSocketServer>;
}

interface DebugMiddlewareParams {
  serverBaseUrl: string;
  reporter: TerminalReporter;
}

export function createDebugMiddleware({
  serverBaseUrl,
  reporter,
}: DebugMiddlewareParams): DebugMiddleware {
  // Load the React Native debugging tools from project
  // TODO: check if this works with isolated modules
  const { createDevMiddleware } =
    require('@react-native/dev-middleware') as typeof import('@react-native/dev-middleware');

  const { middleware, websocketEndpoints } = createDevMiddleware({
    // TODO: Check with cedric why this can be removed
    // https://github.com/facebook/react-native/pull/53921
    // projectRoot: metroBundler.projectRoot,
    serverBaseUrl,
    logger: createLogger(reporter),
    unstable_customInspectorMessageHandler: createHandlersFactory(),
    // TODO: Forward all events to the shared Metro log reporter. Do this when we have opinions on how all logs should be presented.
    // unstable_eventReporter: {
    //   logEvent(event) {
    //     reporter.update(event);
    //   },
    // },
    unstable_experiments: {
      // Enable the Network tab in React Native DevTools
      enableNetworkInspector: true,
      // Only enable opening the browser version of React Native DevTools when debugging.
      // This is useful when debugging the React Native DevTools by going to `/open-debugger` in the browser.
      enableOpenDebuggerRedirect: env.EXPO_DEBUG,
      // The standalone fusebox shell (@react-native/debugger-shell) starts installing almost
      // immediately in the background when the dev middleware is created, which we don't
      // always want to happen
      enableStandaloneFuseboxShell: !envIsHeadless(),
    },
  });

  const debuggerWebsocketEndpoint = websocketEndpoints['/inspector/debug'] as WebSocketServer;

  // NOTE(cedric): add a temporary websocket to handle Network-related CDP events
  websocketEndpoints['/inspector/network'] = createNetworkWebsocket(debuggerWebsocketEndpoint);

  // Explicitly limit debugger websocket to loopback requests
  debuggerWebsocketEndpoint.on('connection', (socket, request) => {
    if (!isLocalSocket(request.socket) || !isMatchingOrigin(request, serverBaseUrl)) {
      // NOTE: `socket.close` nicely closes the websocket, which will still allow incoming messages
      // `socket.terminate` instead forcefully closes down the socket
      socket.terminate();
    }
  });

  return {
    debugMiddleware(req, res, next) {
      // The debugger middleware is skipped entirely if the connection isn't a loopback request
      if (isLocalSocket(req.socket)) {
        return middleware(req, res, next);
      } else {
        return next();
      }
    },
    debugWebsocketEndpoints: websocketEndpoints,
  };
}

function createLogger(
  reporter: TerminalReporter
): Parameters<typeof import('@react-native/dev-middleware').createDevMiddleware>[0]['logger'] {
  return {
    info: makeLogger(reporter, 'info'),
    warn: makeLogger(reporter, 'warn'),
    error: makeLogger(reporter, 'error'),
  };
}

function makeLogger(reporter: TerminalReporter, level: 'info' | 'warn' | 'error') {
  return (...data: any[]) =>
    reporter.update({
      type: 'unstable_server_log',
      level,
      data,
    });
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
    // Bounded so an unauthenticated client cannot exhaust dev-server memory
    // with one oversized frame. 16 MiB covers realistic response bodies
    // (image previews, large JSON dumps, base64-inflated assets).
    maxPayload: 16 * 1024 * 1024,
  });

  wss.on('connection', (networkSocket) => {
    networkSocket.on('message', (data) => {
      try {
        // Parse the network message, to determine how the message should be handled
        const message = JSON.parse(data.toString());

        if (message.method === 'Expo(Network.receivedResponseBody)' && message.params) {
          // If its a response body, write it to the global storage
          const { requestId, ...requestInfo } = message.params;
          recordNetworkResponse(requestId, requestInfo);
        } else if (message.method.startsWith('Network.')) {
          // Otherwise, directly re-broadcast the Network events to all connected debuggers
          debuggerWebsocket.clients.forEach((debuggerSocket) => {
            if (debuggerSocket.readyState === debuggerSocket.OPEN) {
              debuggerSocket.send(data.toString());
            }
          });
        }
      } catch (error) {
        event('network_cdp_failed', { error: event.error(error as Error) });
      }
    });
  });

  return wss;
}
