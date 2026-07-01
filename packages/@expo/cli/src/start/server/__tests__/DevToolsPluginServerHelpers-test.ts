import { loadModule } from '@expo/require-utils';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import {
  type DevToolsPluginWebSocketHandler,
  loadWebSocketServerAsync,
} from '../DevToolsPluginServerHelpers';

jest.mock('@expo/require-utils', () => ({
  ...jest.requireActual('@expo/require-utils'),
  loadModule: jest.fn(),
}));

const mockLoadModule = loadModule as jest.MockedFunction<typeof loadModule>;

function createUpgradeRequest(): IncomingMessage {
  return {
    method: 'GET',
    url: '/_expo/plugins/expo-test-plugin/ws?token=abc',
    headers: { host: 'localhost:8081' },
    rawHeaders: [
      'Host',
      'localhost:8081',
      'Cookie',
      'session=secret',
      'Sec-WebSocket-Protocol',
      'json',
    ],
    socket: {},
  } as unknown as IncomingMessage;
}

describe(loadWebSocketServerAsync, () => {
  it('passes a plugin-relative fetch API Request to the WebSocket handler', async () => {
    const handler = jest.fn<
      ReturnType<DevToolsPluginWebSocketHandler>,
      [WebSocket, Request, any]
    >();
    mockLoadModule.mockResolvedValueOnce({ webSocketHandlers: { '/ws': handler } });

    const servers = await loadWebSocketServerAsync({
      packageName: 'expo-test-plugin',
      serverEntryPoint: '/app/node_modules/expo-test-plugin/server.js',
    });

    const server = servers['/ws'];
    expect(server).toBeDefined();

    const socket = {} as WebSocket;
    server!.emit('connection', socket, createUpgradeRequest());

    expect(handler).toHaveBeenCalledTimes(1);
    const [receivedSocket, request, receivedServer] = handler.mock.calls[0]!;
    expect(receivedSocket).toBe(socket);
    expect(receivedServer).toBe(server);

    // Web-style Request, not the Node.js IncomingMessage, with the plugin endpoint
    // prefix (`/_expo/plugins/expo-test-plugin`) stripped so the URL is plugin-relative.
    expect(request).toBeInstanceOf(Request);
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost:8081/ws?token=abc');
    expect(request.headers.get('cookie')).toBe('session=secret');
    expect(request.headers.get('sec-websocket-protocol')).toBe('json');
  });

  it('prefixes routes with a leading slash', async () => {
    mockLoadModule.mockResolvedValueOnce({ webSocketHandlers: { ws: jest.fn() } });

    const servers = await loadWebSocketServerAsync({
      packageName: 'expo-test-plugin',
      serverEntryPoint: '/app/node_modules/expo-test-plugin/server.js',
    });

    expect(Object.keys(servers)).toEqual(['/ws']);
  });

  it('throws when a handler is not a function', async () => {
    mockLoadModule.mockResolvedValueOnce({ webSocketHandlers: { '/ws': 'nope' } });

    await expect(
      loadWebSocketServerAsync({
        packageName: 'expo-test-plugin',
        serverEntryPoint: '/app/node_modules/expo-test-plugin/server.js',
      })
    ).rejects.toThrow(/must be a function/);
  });

  it('returns an empty map when no handlers are exported', async () => {
    mockLoadModule.mockResolvedValueOnce({});

    const servers = await loadWebSocketServerAsync({
      packageName: 'expo-test-plugin',
      serverEntryPoint: '/app/node_modules/expo-test-plugin/server.js',
    });

    expect(servers).toEqual({});
  });
});
