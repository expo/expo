import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import { ModelContextRegistry } from '../ModelContextRegistry';
import {
  MODEL_CONTEXT_ENDPOINT,
  createModelContextWebsocketEndpoint,
} from '../ModelContextWebsocketEndpoint';

const TODO_TOOL = {
  name: 'add-todo',
  description: 'Add a todo',
  inputSchema: { type: 'object' as const, properties: { text: { type: 'string' } } },
};

function connect(registry: ModelContextRegistry, id = 'c1') {
  const send = jest.fn();
  registry.addConnection({ id, send });
  return { id, send };
}

describe(ModelContextRegistry, () => {
  it('should register a tool under its own name', () => {
    const registry = new ModelContextRegistry();
    connect(registry);
    registry.registerTool('c1', TODO_TOOL);
    expect(registry.listTools()).toEqual([{ ...TODO_TOOL, connectionId: 'c1' }]);
  });

  it('should replace a tool when a later registration uses the same name', () => {
    const registry = new ModelContextRegistry();
    connect(registry, 'c1');
    connect(registry, 'c2');
    registry.registerTool('c1', TODO_TOOL);
    registry.registerTool('c2', { ...TODO_TOOL, description: 'Add a todo item' });

    expect(registry.listTools()).toEqual([
      { ...TODO_TOOL, description: 'Add a todo item', connectionId: 'c2' },
    ]);
    expect(registry.unregisterTool('c1', 'add-todo')).toBe(false);
  });

  it('should unregister tools and clear them when the connection closes', () => {
    const registry = new ModelContextRegistry();
    connect(registry);
    registry.registerTool('c1', TODO_TOOL);
    registry.registerTool('c1', { ...TODO_TOOL, name: 'list-todos' });
    expect(registry.unregisterTool('c1', 'add-todo')).toBe(true);
    expect(registry.unregisterTool('other', 'list-todos')).toBe(false);

    registry.removeConnection('c1');
    expect(registry.listTools()).toHaveLength(0);
    expect(registry.getConnectionCount()).toBe(0);
  });

  it('should forward a call to the app and resolve with the validated result', async () => {
    const registry = new ModelContextRegistry();
    const { send } = connect(registry);
    registry.registerTool('c1', TODO_TOOL);

    const promise = registry.callToolAsync('add-todo', { text: 'milk' });
    const request = send.mock.calls[0][0];
    expect(request).toMatchObject({
      method: 'tools/call',
      params: { name: 'add-todo', arguments: { text: 'milk' }, timeoutMs: 10000 },
    });
    expect(
      registry.handleResponse('c1', {
        id: request.id,
        result: { content: [{ type: 'text', text: 'Added' }] },
      })
    ).toBe(true);
    await expect(promise).resolves.toEqual({ content: [{ type: 'text', text: 'Added' }] });
  });

  it('should reject an unknown tool', async () => {
    const registry = new ModelContextRegistry();
    await expect(registry.callToolAsync('missing', {})).rejects.toThrow(/Unknown tool "missing"/);
  });

  it('should reject on tool errors, invalid results, and responses from other connections', async () => {
    const registry = new ModelContextRegistry();
    const { send } = connect(registry);
    connect(registry, 'c2');
    registry.registerTool('c1', TODO_TOOL);

    const failing = registry.callToolAsync('add-todo', {});
    const id = send.mock.calls[0][0].id;
    expect(registry.handleResponse('c2', { id, result: { content: [] } })).toBe(false);
    registry.handleResponse('c1', { id, error: { code: -32000, message: 'boom' } });
    await expect(failing).rejects.toThrow('boom');

    const invalid = registry.callToolAsync('add-todo', {});
    registry.handleResponse('c1', {
      id: send.mock.calls[1][0].id,
      result: { content: 'not-an-array' },
    });
    await expect(invalid).rejects.toThrow(/invalid result/);
  });

  it('should time out and reject when the app disconnects', async () => {
    jest.useFakeTimers();
    try {
      const registry = new ModelContextRegistry();
      connect(registry);
      registry.registerTool('c1', TODO_TOOL);

      const timedOut = registry.callToolAsync('add-todo', {}, { timeoutMs: 50 });
      jest.advanceTimersByTime(60);
      await expect(timedOut).rejects.toThrow(/timed out after 50ms/);

      const disconnected = registry.callToolAsync('add-todo', {});
      registry.removeConnection('c1');
      await expect(disconnected).rejects.toThrow(/disconnected/);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe(createModelContextWebsocketEndpoint, () => {
  /**
   * Drives the endpoint through `wss.emit('connection', …)` with an in-memory socket, so the
   * tests do not depend on ports or on how loaded the machine is.
   */
  function createHarness({
    serverBaseUrl = 'http://localhost:8081',
    tunnelUrl = null,
  }: { serverBaseUrl?: string; tunnelUrl?: string | null } = {}) {
    const registry = new ModelContextRegistry();
    const wss = createModelContextWebsocketEndpoint({
      registry,
      serverBaseUrl,
      getTunnelUrl: () => tunnelUrl,
    })[MODEL_CONTEXT_ENDPOINT]!;

    function connectSocket({
      origin,
      remoteAddress = '127.0.0.1',
    }: { origin?: string; remoteAddress?: string } = {}) {
      const socket = new EventEmitter() as EventEmitter & { send: jest.Mock; close: jest.Mock };
      const replies: any[] = [];
      socket.send = jest.fn((data: string) => replies.push(JSON.parse(data)));
      socket.close = jest.fn();
      const request = {
        headers: origin ? { origin } : {},
        socket: { remoteAddress, localAddress: '127.0.0.1', remoteFamily: 'IPv4' },
      } as unknown as IncomingMessage;
      wss.emit('connection', socket as unknown as WebSocket, request);

      let nextId = 1;
      const send = (message: Record<string, unknown>) =>
        socket.emit('message', Buffer.from(JSON.stringify({ version: 2, ...message })), false);
      const call = (method: string, params: unknown) => {
        const id = `req-${nextId++}`;
        send({ id, method, params });
        return replies.find((message) => message.id === id);
      };
      return { socket, replies, send, call, close: () => socket.emit('close') };
    }

    return { registry, connectSocket };
  }

  it('should register, call, and unregister a tool over the socket', async () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket();

    expect(client.call('modelContext/registerTool', TODO_TOOL)).toEqual({
      version: 2,
      id: 'req-1',
      result: { name: 'add-todo' },
    });

    // The app answers the forwarded `tools/call`.
    const pending = registry.callToolAsync('add-todo', { text: 'milk' });
    const forwarded = client.replies.find((message) => message.method === 'tools/call');
    expect(forwarded).toMatchObject({ params: { name: 'add-todo', arguments: { text: 'milk' } } });
    client.send({ id: forwarded.id, result: { content: [{ type: 'text', text: 'got milk' }] } });
    await expect(pending).resolves.toEqual({ content: [{ type: 'text', text: 'got milk' }] });

    expect(client.call('modelContext/unregisterTool', { name: 'add-todo' })).toMatchObject({
      result: { removed: true },
    });
    expect(registry.listTools()).toHaveLength(0);
  });

  it('should accept a device on the lan', () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket({ remoteAddress: '192.168.1.20' });
    expect(client.call('modelContext/registerTool', TODO_TOOL)).toMatchObject({
      result: { name: 'add-todo' },
    });
    expect(registry.listTools()).toHaveLength(1);
  });

  it('should accept a web app opened on another loopback name', () => {
    const { registry, connectSocket } = createHarness({ serverBaseUrl: 'http://127.0.0.1:8081' });
    for (const origin of ['http://localhost:8081', 'http://[::1]:8081']) {
      const client = connectSocket({ origin });
      expect(client.socket.close).not.toHaveBeenCalled();
      expect(client.call('modelContext/registerTool', TODO_TOOL)).toMatchObject({
        result: { name: 'add-todo' },
      });
    }
    expect(registry.listTools()).toHaveLength(1);
  });

  it('should accept a web app opened on the tunnel host', () => {
    const { registry, connectSocket } = createHarness({ tunnelUrl: 'https://abc.exp.direct' });
    const client = connectSocket({ origin: 'https://abc.exp.direct' });
    expect(client.call('modelContext/registerTool', TODO_TOOL)).toMatchObject({
      result: { name: 'add-todo' },
    });
    expect(registry.listTools()).toHaveLength(1);
  });

  it('should close a loopback origin on another port', () => {
    const { connectSocket } = createHarness({ serverBaseUrl: 'http://127.0.0.1:8081' });
    const client = connectSocket({ origin: 'http://localhost:3000' });
    expect(client.socket.close).toHaveBeenCalledWith(1008, expect.any(String));
  });

  it('should accept "$ref" as a value but not as a key', () => {
    const { connectSocket } = createHarness();
    const client = connectSocket();
    expect(
      client.call('modelContext/registerTool', {
        ...TODO_TOOL,
        inputSchema: { type: 'object', properties: { kind: { const: '$ref' } } },
      })
    ).toMatchObject({ result: { name: 'add-todo' } });
  });

  it('should remove the tools of a socket when it closes', () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket();
    client.call('modelContext/registerTool', TODO_TOOL);
    client.close();
    expect(registry.getConnectionCount()).toBe(0);
    expect(registry.listTools()).toHaveLength(0);
  });

  it('should ignore binary frames, malformed json, and messages without the envelope version', () => {
    const { connectSocket } = createHarness();
    const client = connectSocket();
    client.socket.emit('message', Buffer.from('binary'), true);
    client.socket.emit('message', Buffer.from('{not json'), false);
    client.socket.emit(
      'message',
      Buffer.from('{"id":1,"method":"modelContext/registerTool"}'),
      false
    );
    expect(client.replies).toHaveLength(0);
  });

  it('should reject invalid params and unknown methods', () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket();

    expect(
      client.call('modelContext/registerTool', { ...TODO_TOOL, name: 'bad name!' })
    ).toMatchObject({ error: { code: -32602, message: expect.stringMatching(/name/) } });
    expect(
      client.call('modelContext/registerTool', {
        ...TODO_TOOL,
        inputSchema: { type: 'object', properties: { a: { $ref: '#/x' } } },
      })
    ).toMatchObject({ error: { message: expect.stringMatching(/\$ref/) } });
    expect(client.call('nope', {})).toMatchObject({ error: { code: -32601 } });
    expect(registry.listTools()).toHaveLength(0);
  });

  it('should close a connection from another browser origin', () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket({ origin: 'http://evil.example' });
    expect(client.socket.close).toHaveBeenCalledWith(1008, expect.any(String));
    expect(registry.getConnectionCount()).toBe(0);
  });
});
