import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';

import { watchConsoleTargets } from '../ConsoleTargetWatcher';
import type { ConsoleTargetWatcher } from '../ConsoleTargetWatcher';
import type { ConsoleEntry } from '../types';

let server: Server;
let serverBaseUrl: string;
let debuggerSocketServer: WebSocketServer;
let deviceSocketServer: WebSocketServer;
let deviceSocket: EventEmitter;
let watcher: ConsoleTargetWatcher;
let pages: object[];
let pagesTimer: ReturnType<typeof setInterval>;
let startedAt: number;

function page({ supportsMultipleDebuggers = true } = {}) {
  return {
    id: '1',
    title: 'com.example (iPhone)',
    app: 'com.example',
    capabilities: { supportsMultipleDebuggers },
  };
}

function consoleCall(msAfterStart: number, overrides: object = {}) {
  return JSON.stringify({
    method: 'Runtime.consoleAPICalled',
    params: {
      type: 'log',
      timestamp: startedAt + msAfterStart,
      args: [{ type: 'string', value: 'hello' }],
      ...overrides,
    },
  });
}

function nextDebuggerSocket(): Promise<{ socket: WebSocket; origin?: string; url?: string }> {
  return new Promise((resolve) =>
    debuggerSocketServer.once('connection', (socket, request) =>
      resolve({ socket, origin: request.headers.origin, url: request.url })
    )
  );
}

function nextMessage(socket: WebSocket): Promise<{ method: string }> {
  return new Promise((resolve) =>
    socket.once('message', (data) => resolve(JSON.parse(data.toString())))
  );
}

function connectDevice() {
  deviceSocket = new EventEmitter();
  deviceSocketServer.emit('connection', deviceSocket, {
    url: '/inspector/device?device=device&name=iPhone',
  });
}

function watch(onEntry: (entry: ConsoleEntry) => void = () => {}, enableIntervalMs?: number) {
  startedAt = Date.now();
  watcher = watchConsoleTargets({ serverBaseUrl, deviceSocketServer, onEntry, enableIntervalMs });
  connectDevice();
  pagesTimer = setInterval(
    () => deviceSocket.emit('message', JSON.stringify({ event: 'getPages', payload: pages })),
    5
  );
}

beforeEach(async () => {
  pages = [];
  debuggerSocketServer = new WebSocketServer({ noServer: true });
  deviceSocketServer = new WebSocketServer({ noServer: true });
  server = createServer();
  server.on('upgrade', (request, socket, head) =>
    debuggerSocketServer.handleUpgrade(request, socket, head, (ws) =>
      debuggerSocketServer.emit('connection', ws, request)
    )
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  serverBaseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  clearInterval(pagesTimer);
  watcher.close();
  for (const socket of debuggerSocketServer.clients) {
    socket.terminate();
  }
  await new Promise((resolve) => server.close(resolve));
});

test('enables only the Runtime domain on an app its device lists', async () => {
  pages = [page()];
  watch();

  const { socket, origin, url } = await nextDebuggerSocket();

  expect(origin).toBe(serverBaseUrl);
  expect(url).toBe('/inspector/debug?device=device&page=1');
  expect(await nextMessage(socket)).toMatchObject({ method: 'Runtime.enable' });
  await expect(
    Promise.race([nextMessage(socket), new Promise((resolve) => setTimeout(resolve, 50, 'idle'))])
  ).resolves.toBe('idle');
});

test('enables a session again when its device reconnects', async () => {
  pages = [page()];
  watch();
  const { socket } = await nextDebuggerSocket();
  await nextMessage(socket);

  connectDevice();

  expect(await nextMessage(socket)).toMatchObject({ method: 'Runtime.enable' });
});

test('enables an open session again at an interval', async () => {
  pages = [page()];
  watch(undefined, 20);
  const { socket } = await nextDebuggerSocket();
  await nextMessage(socket);

  expect(await nextMessage(socket)).toMatchObject({ method: 'Runtime.enable' });
});

test('skips an app that accepts a single debugger', async () => {
  pages = [page({ supportsMultipleDebuggers: false })];
  const onConnection = jest.fn();
  debuggerSocketServer.on('connection', onConnection);
  watch();

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(onConnection).not.toHaveBeenCalled();
});

test('closes the session with an app its device stops listing', async () => {
  pages = [page()];
  watch();
  const { socket } = await nextDebuggerSocket();
  const closed = new Promise((resolve) => socket.once('close', resolve));

  pages = [];

  await closed;
});

test('reports console calls, without host notices or calls replayed from an earlier session', async () => {
  pages = [page()];
  const entries: ConsoleEntry[] = [];
  watch((entry) => entries.push(entry));

  const first = await nextDebuggerSocket();
  first.socket.send(consoleCall(-1000));
  first.socket.send(consoleCall(1, { context: 'main#InstanceAgent' }));
  first.socket.send(consoleCall(2));
  first.socket.send(consoleCall(3));
  await nextMessage(first.socket);

  const reconnected = nextDebuggerSocket();
  first.socket.close();
  const second = await reconnected;
  second.socket.send(consoleCall(2));
  second.socket.send(consoleCall(3));
  second.socket.send(consoleCall(4));
  await nextMessage(second.socket);
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(entries.map((entry) => entry.timestamp - startedAt)).toEqual([2, 3, 4]);
});
