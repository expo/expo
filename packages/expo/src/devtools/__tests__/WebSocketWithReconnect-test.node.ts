import { WebSocket, WebSocketServer } from 'ws';

import { WebSocketWithReconnect } from '../WebSocketWithReconnect';

// @ts-expect-error - The WebSocket from ws is not compatible with the globalThis.WebSocket
globalThis.WebSocket = WebSocket;

describe(WebSocketWithReconnect, () => {
  let ws: WebSocketWithReconnect | null = null;
  let server: WebSocketServer | null = null;

  afterEach(async () => {
    ws?.close();
    await closeServerAsync(server);
  });

  it('should act as a WebSocket', async () => {
    server = new WebSocketServer({ port: 8000 });
    // An echoing server
    server?.addListener('connection', (socket) => {
      socket.addEventListener('message', (e) => {
        socket.send(e.data);
      });
    });

    ws = new WebSocketWithReconnect('ws://localhost:8000');
    let received = '';
    ws.addEventListener('message', (e) => {
      received = e.data;
    });
    await new Promise((resolve) => {
      ws?.addEventListener('open', () => {
        resolve(null);
      });
    });
    expect(ws.readyState).toBe(WebSocket.OPEN);

    ws.send('hello');
    await delayAsync(50);
    expect(received).toBe('hello');
  });

  it('should reconnect when the connection is lost', async () => {
    server = new WebSocketServer({ port: 8000 });

    const mockOnReconnect = jest.fn();
    ws = new WebSocketWithReconnect('ws://localhost:8000', {
      retriesInterval: 10,
      onReconnect: mockOnReconnect,
    });
    await new Promise((resolve) => {
      ws?.addEventListener('open', () => {
        resolve(null);
      });
    });
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await closeServerAsync(server);
    server = new WebSocketServer({ port: 8000 });
    await delayAsync(100);

    expect(ws.readyState).toBe(WebSocket.OPEN);
    expect(mockOnReconnect.mock.calls.length).toBeGreaterThan(2);
  });

  it('should keep sending messages when retrying connection', async () => {
    server = new WebSocketServer({ port: 8000 });
    ws = new WebSocketWithReconnect('ws://localhost:8000', {
      retriesInterval: 10,
    });
    await new Promise((resolve) => {
      ws?.addEventListener('open', () => {
        resolve(null);
      });
    });
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await closeServerAsync(server);

    expect(ws.readyState).not.toBe(WebSocket.OPEN);
    ws.send('hello');

    server = new WebSocketServer({ port: 8000 });
    const receivedPromise = new Promise((resolve) => {
      server?.addListener('connection', (socket) => {
        socket.addEventListener('message', (e) => {
          resolve(e.data);
        });
      });
    });

    await delayAsync(30);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    const received = await receivedPromise;
    expect(received).toBe('hello');
  });

  it('should throw errors if exceeds max retries', async () => {
    server = new WebSocketServer({ port: 8000 });

    const mockOnError = jest.fn();
    ws = new WebSocketWithReconnect('ws://localhost:8000', {
      retriesInterval: 10,
      maxRetries: 2,
      onError: mockOnError,
    });
    await closeServerAsync(server);
    await delayAsync(100);
    expect(mockOnError).toHaveBeenCalled();
  });

  it('should show connecting state when reconnecting', async () => {
    server = new WebSocketServer({ port: 8000 });

    ws = new WebSocketWithReconnect('ws://localhost:8000', {
      retriesInterval: 1000,
    });
    await closeServerAsync(server);
    await delayAsync(100);
    expect(ws.readyState).toBe(WebSocket.CONNECTING);
  });
});

async function closeServerAsync(server: WebSocketServer | null) {
  if (server == null) {
    return;
  }
  server.close();
  for (const client of server.clients) {
    client.terminate();
  }
  await delayAsync(30);
}

async function delayAsync(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
