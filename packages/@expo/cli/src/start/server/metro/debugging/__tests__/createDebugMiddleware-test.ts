import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { EventEmitter } from 'events';

// ---- Mocks ----

// Mock the env module so we can control EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING per-test
let mockAllowRemoteDebugging = false;
jest.mock('../../../../../utils/env', () => ({
  get env() {
    return {
      get EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING() {
        return mockAllowRemoteDebugging;
      },
      EXPO_DEBUG: false,
    };
  },
  envIsHeadless: () => false,
}));

// Track calls to the real net utilities so we can verify security logic
jest.mock('../../../../../utils/net', () => {
  const actual = jest.requireActual('../../../../../utils/net');
  return {
    isLocalSocket: jest.fn(actual.isLocalSocket),
    isMatchingOrigin: jest.fn(actual.isMatchingOrigin),
  };
});

// Capture what dev-middleware receives and provide controllable websocket endpoints
const mockDevMiddleware = jest.fn();
jest.mock('@react-native/dev-middleware', () => ({
  createDevMiddleware: mockDevMiddleware,
}));

jest.mock('../../TerminalReporter');
jest.mock('../createHandlersFactory', () => ({
  createHandlersFactory: () => jest.fn(),
}));

import { isLocalSocket, isMatchingOrigin } from '../../../../../utils/net';
import { createDebugMiddleware } from '../createDebugMiddleware';

// ---- Helpers ----

function createMockSocket(overrides: Partial<Socket> = {}): Socket {
  return {
    localAddress: '127.0.0.1',
    remoteAddress: '127.0.0.1',
    remoteFamily: 'IPv4',
    encrypted: false,
    ...overrides,
  } as unknown as Socket;
}

function createMockRequest(
  overrides: {
    socket?: Partial<Socket>;
    headers?: Record<string, string>;
  } = {}
): IncomingMessage {
  return {
    socket: createMockSocket(overrides.socket),
    headers: overrides.headers ?? {},
  } as unknown as IncomingMessage;
}

/** Create a fake WebSocketServer-like EventEmitter that tracks terminate/close calls */
function createMockWebSocketServer() {
  const wss = new EventEmitter();
  return wss;
}

function createMockReporter() {
  return { update: jest.fn() } as any;
}

/** Set up the mock for @react-native/dev-middleware and return controllers */
function setupDevMiddleware() {
  const debuggerWss = createMockWebSocketServer();
  const innerMiddleware = jest.fn((_req: any, _res: any, next: any) => next());

  mockDevMiddleware.mockReturnValue({
    middleware: innerMiddleware,
    websocketEndpoints: {
      '/inspector/debug': debuggerWss,
    },
  });

  return { debuggerWss, innerMiddleware };
}

// ---- Tests ----

beforeEach(() => {
  jest.clearAllMocks();
  mockAllowRemoteDebugging = false;
  delete process.env.EXPO_PACKAGER_PROXY_URL;
});

describe('createDebugMiddleware', () => {
  // ------------------------------------------------------------------
  // Default mode: remote debugging DISABLED
  // ------------------------------------------------------------------
  describe('when EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING is disabled', () => {
    describe('WebSocket connections', () => {
      it('allows local connections with matching origin', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
      });

      it('terminates non-local connections', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
      });

      it('terminates local connections with mismatched origin', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
          headers: { origin: 'http://evil.example.com' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
      });
    });

    describe('HTTP middleware', () => {
      it('forwards local requests to inner middleware', () => {
        const { innerMiddleware } = setupDevMiddleware();
        const { debugMiddleware } = createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const req = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
        });
        const res = {} as ServerResponse;
        const next = jest.fn();

        debugMiddleware(req, res, next);
        expect(innerMiddleware).toHaveBeenCalledWith(req, res, expect.any(Function));
      });

      it('skips inner middleware for non-local requests', () => {
        const { innerMiddleware } = setupDevMiddleware();
        const { debugMiddleware } = createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const req = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
        });
        const res = {} as ServerResponse;
        const next = jest.fn();

        debugMiddleware(req, res, next);
        expect(innerMiddleware).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });
    });
  });

  // ------------------------------------------------------------------
  // Remote debugging ENABLED
  // ------------------------------------------------------------------
  describe('when EXPO_DANGEROUSLY_ALLOW_REMOTE_DEBUGGING is enabled', () => {
    beforeEach(() => {
      mockAllowRemoteDebugging = true;
    });

    describe('WebSocket connections', () => {
      it('allows local connections with matching server origin', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
      });

      it('allows remote connections with matching server origin', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
      });

      it('allows remote connections with matching proxy/tunnel origin', () => {
        process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com';
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          headers: { origin: 'https://my-tunnel.example.com' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
      });

      it('terminates remote connections with unknown origin', () => {
        process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com';
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          headers: { origin: 'https://evil.example.com' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
      });

      it('terminates remote connections when no proxy URL is configured and origin does not match server', () => {
        // No EXPO_PACKAGER_PROXY_URL set
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          headers: { origin: 'https://random-attacker.com' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
      });

      it('logs a warning for accepted non-local connections', () => {
        const reporter = createMockReporter();
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter,
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
          // Match the server origin so it's accepted
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
        expect(reporter.update).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'unstable_server_log',
            level: 'warn',
            data: [expect.stringContaining('Remote debugger connection accepted')],
          })
        );
      });

      it('does not log a warning for local connections', () => {
        const reporter = createMockReporter();
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter,
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
          headers: { origin: 'http://127.0.0.1:8081' },
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(reporter.update).not.toHaveBeenCalled();
      });

      it('allows connections without Origin header (local socket)', () => {
        const { debuggerWss } = setupDevMiddleware();
        createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const mockWsSocket = { terminate: jest.fn() };
        const mockRequest = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
          headers: {}, // no origin
        });

        debuggerWss.emit('connection', mockWsSocket, mockRequest);
        expect(mockWsSocket.terminate).not.toHaveBeenCalled();
      });
    });

    describe('HTTP middleware', () => {
      it('forwards non-local requests to inner middleware', () => {
        const { innerMiddleware } = setupDevMiddleware();
        const { debugMiddleware } = createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const req = createMockRequest({
          socket: {
            localAddress: '127.0.0.1',
            remoteAddress: '10.0.0.5',
            remoteFamily: 'IPv4',
          },
        });
        const res = {} as ServerResponse;
        const next = jest.fn();

        debugMiddleware(req, res, next);
        expect(innerMiddleware).toHaveBeenCalled();
      });

      it('still forwards local requests to inner middleware', () => {
        const { innerMiddleware } = setupDevMiddleware();
        const { debugMiddleware } = createDebugMiddleware({
          serverBaseUrl: 'http://127.0.0.1:8081',
          reporter: createMockReporter(),
        });

        const req = createMockRequest({
          socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
        });
        const res = {} as ServerResponse;
        const next = jest.fn();

        debugMiddleware(req, res, next);
        expect(innerMiddleware).toHaveBeenCalled();
      });
    });
  });

  // ------------------------------------------------------------------
  // TLS/encrypted socket marking for proxy passthrough
  // ------------------------------------------------------------------
  describe('TLS socket marking behind a proxy', () => {
    it('marks socket as encrypted when proxy URL is HTTPS', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com';
      const { innerMiddleware } = setupDevMiddleware();

      // Capture the request passed to innerMiddleware
      innerMiddleware.mockImplementation((req: any, _res: any, _next: any) => {
        // At this point, the socket should be marked as encrypted
        expect(req.socket.encrypted).toBe(true);
      });

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      // Ensure it's configurable like a real socket
      Object.defineProperty(socket, 'encrypted', { value: false, configurable: true });

      const req = { socket, headers: {} } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      expect(innerMiddleware).toHaveBeenCalled();
    });

    it('restores encrypted to false when next() is called', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com';
      const { innerMiddleware } = setupDevMiddleware();

      // Call the next function that the middleware wraps
      innerMiddleware.mockImplementation((_req: any, _res: any, wrappedNext: any) => {
        wrappedNext();
      });

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      Object.defineProperty(socket, 'encrypted', { value: false, configurable: true });

      const req = { socket, headers: {} } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      // After next() was called by innerMiddleware, encrypted should be restored
      expect(socket.encrypted).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('marks socket as encrypted when x-forwarded-proto is https and proxy is configured', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'http://my-tunnel.example.com';
      const { innerMiddleware } = setupDevMiddleware();

      innerMiddleware.mockImplementation((req: any, _res: any, _next: any) => {
        expect(req.socket.encrypted).toBe(true);
      });

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      Object.defineProperty(socket, 'encrypted', { value: false, configurable: true });

      const req = {
        socket,
        headers: { 'x-forwarded-proto': 'https' },
      } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      expect(innerMiddleware).toHaveBeenCalled();
    });

    it('does not mark socket as encrypted when no proxy is configured', () => {
      // No EXPO_PACKAGER_PROXY_URL
      const { innerMiddleware } = setupDevMiddleware();

      innerMiddleware.mockImplementation((req: any, _res: any, _next: any) => {
        expect(req.socket.encrypted).toBe(false);
      });

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      Object.defineProperty(socket, 'encrypted', { value: false, configurable: true });

      const req = {
        socket,
        headers: { 'x-forwarded-proto': 'https' },
      } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      expect(innerMiddleware).toHaveBeenCalled();
    });

    it('does not mark socket as encrypted when x-forwarded-proto is http', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'http://my-tunnel.example.com';
      const { innerMiddleware } = setupDevMiddleware();

      innerMiddleware.mockImplementation((req: any, _res: any, _next: any) => {
        expect(req.socket.encrypted).toBe(false);
      });

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      Object.defineProperty(socket, 'encrypted', { value: false, configurable: true });

      const req = {
        socket,
        headers: { 'x-forwarded-proto': 'http' },
      } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      expect(innerMiddleware).toHaveBeenCalled();
    });

    it('does not double-mark a socket that is already encrypted', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com';
      const { innerMiddleware } = setupDevMiddleware();

      const { debugMiddleware } = createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const socket = createMockSocket({
        localAddress: '127.0.0.1',
        remoteAddress: '127.0.0.1',
      });
      Object.defineProperty(socket, 'encrypted', { value: true, configurable: true });

      const req = { socket, headers: {} } as unknown as IncomingMessage;
      const res = {} as ServerResponse;
      const next = jest.fn();

      debugMiddleware(req, res, next);
      // The next function should be passed through as-is (not wrapped)
      // since the socket is already encrypted. Verify by checking that
      // innerMiddleware receives `next` directly (or a passthrough wrapper).
      expect(innerMiddleware).toHaveBeenCalled();
      // Socket should still be encrypted after the call
      expect(socket.encrypted).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // Proxy base URL parsing
  // ------------------------------------------------------------------
  describe('proxy base URL origin validation', () => {
    beforeEach(() => {
      mockAllowRemoteDebugging = true;
    });

    it('accepts connection when proxy URL has a path component (only origin is matched)', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com/some/path';
      const { debuggerWss } = setupDevMiddleware();
      createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const mockWsSocket = { terminate: jest.fn() };
      // Origin header only contains the origin, not the path
      const mockRequest = createMockRequest({
        socket: {
          localAddress: '127.0.0.1',
          remoteAddress: '10.0.0.5',
          remoteFamily: 'IPv4',
        },
        headers: { origin: 'https://my-tunnel.example.com' },
      });

      debuggerWss.emit('connection', mockWsSocket, mockRequest);
      expect(mockWsSocket.terminate).not.toHaveBeenCalled();
    });

    it('rejects connection when proxy URL is an invalid URL', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'not-a-valid-url';
      const { debuggerWss } = setupDevMiddleware();
      createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const mockWsSocket = { terminate: jest.fn() };
      const mockRequest = createMockRequest({
        socket: {
          localAddress: '127.0.0.1',
          remoteAddress: '10.0.0.5',
          remoteFamily: 'IPv4',
        },
        headers: { origin: 'http://not-a-valid-url' },
      });

      debuggerWss.emit('connection', mockWsSocket, mockRequest);
      expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
    });

    it('matches proxy URL with non-standard port', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com:9999';
      const { debuggerWss } = setupDevMiddleware();
      createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const mockWsSocket = { terminate: jest.fn() };
      const mockRequest = createMockRequest({
        socket: {
          localAddress: '127.0.0.1',
          remoteAddress: '10.0.0.5',
          remoteFamily: 'IPv4',
        },
        headers: { origin: 'https://my-tunnel.example.com:9999' },
      });

      debuggerWss.emit('connection', mockWsSocket, mockRequest);
      expect(mockWsSocket.terminate).not.toHaveBeenCalled();
    });

    it('rejects when proxy port does not match origin port', () => {
      process.env.EXPO_PACKAGER_PROXY_URL = 'https://my-tunnel.example.com:9999';
      const { debuggerWss } = setupDevMiddleware();
      createDebugMiddleware({
        serverBaseUrl: 'http://127.0.0.1:8081',
        reporter: createMockReporter(),
      });

      const mockWsSocket = { terminate: jest.fn() };
      const mockRequest = createMockRequest({
        socket: {
          localAddress: '127.0.0.1',
          remoteAddress: '10.0.0.5',
          remoteFamily: 'IPv4',
        },
        headers: { origin: 'https://my-tunnel.example.com:1234' },
      });

      debuggerWss.emit('connection', mockWsSocket, mockRequest);
      expect(mockWsSocket.terminate).toHaveBeenCalledTimes(1);
    });
  });
});
