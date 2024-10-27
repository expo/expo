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
    expect(mockOnReconnect).toHaveBeenCalled();
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

  it('should not emit close event when reconnecting until exceeds maxRetries', async () => {
    server = new WebSocketServer({ port: 8000 });

    const mockOnError = jest.fn();
    ws = new WebSocketWithReconnect('ws://localhost:8000', {
      retriesInterval: 50,
      maxRetries: 2,
      onError: mockOnError,
    });
    const mockClose = jest.fn();
    ws.addEventListener('close', mockClose);
    await closeServerAsync(server);
    await delayAsync(50);
    expect(mockClose).not.toHaveBeenCalled();
    await delayAsync(100);
    expect(mockClose).toHaveBeenCalled();
    expect(ws.readyState).toBe(WebSocket.CLOSED);
    expect(mockOnError).toHaveBeenCalled();
  });

  it('should support arraybuffer binaryType option', async () => {
    server = new WebSocketServer({ port: 8000 });
    // An echoing server
    server?.addListener('connection', (socket) => {
      socket.addEventListener('message', (e) => {
        socket.send(e.data);
      });
    });

    ws = new WebSocketWithReconnect('ws://localhost:8000', { binaryType: 'arraybuffer' });
    let received: any = null;
    ws.addEventListener('message', (e) => {
      received = e.data;
    });
    await new Promise((resolve) => {
      ws?.addEventListener('open', () => {
        resolve(null);
      });
    });
    expect(ws.readyState).toBe(WebSocket.OPEN);

    ws.send(new Uint8Array([0x01, 0x02, 0x03]));
    await delayAsync(50);
    expect(received).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(received as ArrayBuffer)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
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
