import type { NextHandleFunction } from 'connect';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { WebSocketServer } from 'ws';

import type { SocketRemoteFamily } from '../../../../../utils/net';
import { createDebugMiddleware } from '../createDebugMiddleware';

const devMiddleware = jest.fn<ReturnType<NextHandleFunction>, Parameters<NextHandleFunction>>(
  (_req, _res, next) => next()
);
let debuggerWebsocketEndpoint: WebSocketServer;

jest.mock('@react-native/dev-middleware', () => ({
  createDevMiddleware: jest.fn(() => {
    debuggerWebsocketEndpoint = new WebSocketServer({ noServer: true });

    return {
      middleware: devMiddleware,
      websocketEndpoints: {
        '/inspector/debug': debuggerWebsocketEndpoint,
      },
    };
  }),
}));

function createSocket({
  remoteAddress,
  remoteFamily,
}: {
  remoteAddress: string;
  remoteFamily: SocketRemoteFamily;
}): Socket {
  const socket = new Socket();
  Object.defineProperty(socket, 'remoteAddress', { configurable: true, value: remoteAddress });
  Object.defineProperty(socket, 'remoteFamily', { configurable: true, value: remoteFamily });
  return socket;
}

function createRequest({
  remoteAddress,
  remoteFamily = 'IPv4',
  origin,
}: {
  remoteAddress: string;
  remoteFamily?: SocketRemoteFamily;
  origin?: string;
}): IncomingMessage {
  const request = new IncomingMessage(createSocket({ remoteAddress, remoteFamily }));
  if (origin) {
    request.headers.origin = origin;
  }
  return request;
}

function createReporter() {
  return {
    update: jest.fn(),
  };
}

function getDebuggerEndpoint(endpoints: Record<string, WebSocketServer>): WebSocketServer {
  const endpoint = endpoints['/inspector/debug'];
  if (!endpoint) {
    throw new Error('Expected /inspector/debug websocket endpoint');
  }
  return endpoint;
}

describe(createDebugMiddleware, () => {
  beforeEach(() => {
    devMiddleware.mockClear();
  });

  it('skips React Native debug middleware for untrusted proxy sockets', () => {
    const { debugMiddleware } = createDebugMiddleware({
      serverBaseUrl: 'http://localhost:8081',
      reporter: createReporter(),
    });
    const request = createRequest({ remoteAddress: '172.18.0.8' });
    const response = new ServerResponse(request);
    const next = jest.fn();

    debugMiddleware(request, response, next);

    expect(devMiddleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses React Native debug middleware for trusted proxy sockets', () => {
    const { debugMiddleware } = createDebugMiddleware({
      serverBaseUrl: 'http://localhost:8081',
      reporter: createReporter(),
      socketTrustOptions: { trustedProxyCIDRs: ['172.18.0.0/16'] },
    });
    const request = createRequest({ remoteAddress: '172.18.0.8' });
    const response = new ServerResponse(request);
    const next = jest.fn();

    debugMiddleware(request, response, next);

    expect(devMiddleware).toHaveBeenCalledWith(request, response, next);
  });

  it('terminates debugger websocket connections from untrusted proxy sockets', () => {
    const { debugWebsocketEndpoints } = createDebugMiddleware({
      serverBaseUrl: 'http://localhost:8081',
      reporter: createReporter(),
    });
    const socket = { terminate: jest.fn() };
    const request = createRequest({
      remoteAddress: '172.18.0.8',
      origin: 'http://localhost:8081',
    });

    getDebuggerEndpoint(debugWebsocketEndpoints).emit('connection', socket, request);

    expect(socket.terminate).toHaveBeenCalledTimes(1);
  });

  it('keeps debugger websocket connections from trusted proxy sockets', () => {
    const { debugWebsocketEndpoints } = createDebugMiddleware({
      serverBaseUrl: 'http://localhost:8081',
      reporter: createReporter(),
      socketTrustOptions: { trustedProxyCIDRs: ['172.18.0.0/16'] },
    });
    const socket = { terminate: jest.fn() };
    const request = createRequest({
      remoteAddress: '172.18.0.8',
      origin: 'http://localhost:8081',
    });

    getDebuggerEndpoint(debugWebsocketEndpoints).emit('connection', socket, request);

    expect(socket.terminate).not.toHaveBeenCalled();
  });
});
