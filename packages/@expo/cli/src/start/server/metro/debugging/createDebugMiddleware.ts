import type { NextHandleFunction } from 'connect';
import { WebSocketServer } from 'ws';

import { createHandlersFactory } from './createHandlersFactory';
import { env, envIsHeadless } from '../../../../utils/env';
import { isLocalSocket, isMatchingOrigin } from '../../../../utils/net';
import type { TerminalReporter } from '../TerminalReporter';
import { NETWORK_RESPONSE_STORAGE } from './messageHandlers/NetworkResponse';

const debug = require('debug')('expo:metro:debugging:middleware') as typeof console.log;

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

  const allowRemoteDebugging = env.EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING;
  const proxyBaseUrl = getProxyBaseUrl();

  if (!allowRemoteDebugging) {
    // Explicitly limit debugger websocket to loopback requests
    debuggerWebsocketEndpoint.on('connection', (socket, request) => {
      if (!isLocalSocket(request.socket) || !isMatchingOrigin(request, serverBaseUrl)) {
        // NOTE: `socket.close` nicely closes the websocket, which will still allow incoming messages
        // `socket.terminate` instead forcefully closes down the socket
        socket.terminate();
      }
    });
  } else {
    debuggerWebsocketEndpoint.on('connection', (socket, request) => {
      // Still validate the origin when allowing remote connections. Accept
      // connections that match either the local server or the proxy/tunnel URL.
      if (
        !isLocalSocket(request.socket) &&
        !isMatchingOrigin(request, serverBaseUrl) &&
        !(proxyBaseUrl && isMatchingOrigin(request, proxyBaseUrl))
      ) {
        debug(
          'Rejected remote debugger WebSocket from origin %s (expected %s or %s)',
          request.headers.origin,
          serverBaseUrl,
          proxyBaseUrl
        );
        socket.terminate();
        return;
      }
      if (!isLocalSocket(request.socket)) {
        const remoteAddress = request.socket.remoteAddress ?? 'unknown';
        reporter.update({
          type: 'unstable_server_log',
          level: 'warn',
          data: [
            `Remote debugger connection accepted from non-local address: ${remoteAddress}. This is allowed because EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING is enabled.`,
          ],
        });
      }
    });
  }

  return {
    debugMiddleware(req, res, next) {
      // When behind a reverse proxy that terminates TLS, the local socket is
      // plain HTTP but the external URL is HTTPS. @react-native/dev-middleware
      // checks `req.socket.encrypted` to decide between ws:// and wss:// in
      // the /json response. Temporarily mark the socket as encrypted so the
      // generated WebSocket URLs use wss://, avoiding mixed-content errors.
      // This applies to both local and remote requests because the proxy
      // connects from localhost, making the request appear local.
      const shouldMarkEncrypted = isRequestOverHttps(req) && !req.socket.encrypted;
      if (shouldMarkEncrypted) {
        Object.defineProperty(req.socket, 'encrypted', { value: true, configurable: true });
      }
      const wrappedNext = shouldMarkEncrypted
        ? (...args: any[]) => {
            Object.defineProperty(req.socket, 'encrypted', {
              value: false,
              configurable: true,
            });
            return next(...args);
          }
        : next;

      if (isLocalSocket(req.socket)) {
        return middleware(req, res, wrappedNext);
      }
      if (allowRemoteDebugging) {
        return middleware(req, res, wrappedNext);
      }
      return next();
    },
    debugWebsocketEndpoints: websocketEndpoints,
  };
}

/**
 * Get the external proxy/tunnel base URL, if configured. Used for origin
 * validation when allowing remote debugging connections.
 */
function getProxyBaseUrl(): string | null {
  const proxyUrl = process.env.EXPO_PACKAGER_PROXY_URL;
  if (!proxyUrl) {
    return null;
  }
  try {
    const parsed = new URL(proxyUrl);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Detect if the original request was made over HTTPS, even when the local
 * socket is plain HTTP (e.g. behind a TLS-terminating reverse proxy/tunnel).
 * Only trusts `x-forwarded-proto` when a known proxy URL is configured.
 */
function isRequestOverHttps(req: import('http').IncomingMessage): boolean {
  const proxyUrl = process.env.EXPO_PACKAGER_PROXY_URL;
  // Only trust x-forwarded-proto when we know there's a proxy in front of us.
  if (proxyUrl && req.headers['x-forwarded-proto'] === 'https') {
    return true;
  }
  if (proxyUrl && proxyUrl.startsWith('https://')) {
    return true;
  }
  return false;
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
        } else if (message.method.startsWith('Network.')) {
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
