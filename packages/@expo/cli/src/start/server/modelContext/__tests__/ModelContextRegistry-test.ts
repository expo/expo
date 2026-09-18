import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { ToolOwner } from '../ModelContextPolicy';
import { ModelContextRegistry, toMcpName } from '../ModelContextRegistry';
import {
  MODEL_CONTEXT_ENDPOINT,
  createModelContextWebsocketEndpoint,
} from '../ModelContextWebsocketEndpoint';

jest.mock('../../../../log');

const PROJECT_ROOT = '/app';
const POLICY = { allowedPackages: [], deniedTools: [], allowRemoteDevices: false };
const TODO_TOOL = {
  name: 'add-todo',
  description: 'Add a todo',
  inputSchema: { type: 'object' as const, properties: { text: { type: 'string' } } },
};

/** The fake resolver reads the owner from the `stack` string so tests can pick it per tool. */
function createRegistry(owners: Record<string, ToolOwner> = {}) {
  const registry = new ModelContextRegistry(PROJECT_ROOT);
  registry.configure({
    resolveOwner: async ({ stack }) => owners[stack ?? ''] ?? { kind: 'project' },
  });
  return registry;
}

function connect(registry: ModelContextRegistry, id = 'c1', trusted = true) {
  const send = jest.fn();
  registry.addConnection({ id, trusted, send });
  registry.markHello(id, 'ios');
  return { id, send };
}

describe(ModelContextRegistry, () => {
  it('requires hello before registering', async () => {
    const registry = createRegistry();
    registry.addConnection({ id: 'c1', trusted: true, send: jest.fn() });
    await expect(registry.registerToolAsync('c1', TODO_TOOL)).rejects.toThrow(/hello/);
  });

  it('allows project tools and exposes them under app__', async () => {
    const registry = createRegistry();
    connect(registry);
    await expect(registry.registerToolAsync('c1', TODO_TOOL)).resolves.toMatchObject({
      status: 'allowed',
      mcpName: 'app__add-todo',
      owner: { kind: 'project' },
    });
    expect(registry.listAllowedTools()).toHaveLength(1);
  });

  it('applies the policy to package tools, denied tools and untrusted connections', async () => {
    const registry = createRegistry({ sqlite: { kind: 'package', name: 'expo-sqlite' } });
    registry.configure({ policy: { ...POLICY, deniedTools: ['drop-db'] } });
    connect(registry);
    connect(registry, 'lan', false);

    const blocked = await registry.registerToolAsync('c1', {
      ...TODO_TOOL,
      name: 'query',
      stack: 'sqlite',
    });
    expect(blocked).toMatchObject({
      status: 'blocked',
      blockedReason: 'package-not-allowed',
      mcpName: 'pkg_expo-sqlite__query',
    });
    await expect(registry.callToolAsync('pkg_expo-sqlite__query', {})).rejects.toThrow(/blocked/);

    await expect(
      registry.registerToolAsync('c1', { ...TODO_TOOL, name: 'drop-db' })
    ).resolves.toMatchObject({ status: 'blocked', blockedReason: 'denied-tool' });
    await expect(registry.registerToolAsync('lan', TODO_TOOL)).resolves.toMatchObject({
      status: 'blocked',
      blockedReason: 'untrusted-connection',
    });

    registry.configure({ policy: { ...POLICY, allowedPackages: ['expo-sqlite'] } });
    await expect(
      registry.registerToolAsync('c1', { ...TODO_TOOL, name: 'query2', stack: 'sqlite' })
    ).resolves.toMatchObject({ status: 'allowed' });
  });

  it('keeps the first owner of a name and replaces same-owner registrations', async () => {
    const registry = createRegistry({ evil: { kind: 'package', name: 'evil-pkg' } });
    connect(registry);
    await registry.registerToolAsync('c1', TODO_TOOL);
    await expect(
      registry.registerToolAsync('c1', { ...TODO_TOOL, description: 'Shadow', stack: 'evil' })
    ).rejects.toThrow(/already registered by the app/);

    await registry.registerToolAsync('c1', { ...TODO_TOOL, description: 'Add a todo item' });
    expect(registry.listTools()).toHaveLength(1);
    expect(registry.listTools()[0]!.descriptor.description).toBe('Add a todo item');
  });

  it('unregisters tools and clears them when the connection closes', async () => {
    const registry = createRegistry();
    connect(registry);
    await registry.registerToolAsync('c1', TODO_TOOL);
    await registry.registerToolAsync('c1', { ...TODO_TOOL, name: 'list-todos' });
    expect(registry.unregisterTool('c1', 'add-todo')).toBe(true);
    expect(registry.unregisterTool('other', 'list-todos')).toBe(false);
    registry.removeConnection('c1');
    expect(registry.listTools()).toHaveLength(0);
    expect(registry.getConnectionCount()).toBe(0);
  });

  describe('callToolAsync', () => {
    it('forwards the call and resolves with the validated result', async () => {
      const registry = createRegistry();
      const { send } = connect(registry);
      await registry.registerToolAsync('c1', TODO_TOOL);

      const promise = registry.callToolAsync('app__add-todo', { text: 'milk' });
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

    it('rejects on tool errors, invalid results and responses from other connections', async () => {
      const registry = createRegistry();
      const { send } = connect(registry);
      connect(registry, 'c2');
      await registry.registerToolAsync('c1', TODO_TOOL);

      const failing = registry.callToolAsync('app__add-todo', {});
      const id = send.mock.calls[0][0].id;
      expect(registry.handleResponse('c2', { id, result: { content: [] } })).toBe(false);
      registry.handleResponse('c1', { id, error: { code: -32000, message: 'boom' } });
      await expect(failing).rejects.toThrow('boom');

      const invalid = registry.callToolAsync('app__add-todo', {});
      registry.handleResponse('c1', {
        id: send.mock.calls[1][0].id,
        result: { content: 'not-an-array' },
      });
      await expect(invalid).rejects.toThrow(/invalid result/);
    });

    it('times out and rejects when the app disconnects', async () => {
      jest.useFakeTimers();
      try {
        const registry = createRegistry();
        connect(registry);
        await registry.registerToolAsync('c1', TODO_TOOL);

        const timedOut = registry.callToolAsync('app__add-todo', {}, { timeoutMs: 50 });
        jest.advanceTimersByTime(60);
        await expect(timedOut).rejects.toThrow(/timed out after 50ms/);

        const disconnected = registry.callToolAsync('app__add-todo', {});
        registry.removeConnection('c1');
        await expect(disconnected).rejects.toThrow(/disconnected/);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

describe(toMcpName, () => {
  it('namespaces by owner', () => {
    expect(toMcpName('x', { kind: 'project' })).toBe('app__x');
    expect(toMcpName('x', { kind: 'package', name: '@scope/pkg' })).toBe('pkg_scope_pkg__x');
    expect(toMcpName('x', { kind: 'unknown' })).toBe('unknown__x');
  });
});

describe(createModelContextWebsocketEndpoint, () => {
  /**
   * Drives the endpoint through `wss.emit('connection', …)` with an in-memory socket, so the
   * tests do not depend on ports or on how loaded the machine is.
   */
  function createHarness() {
    const registry = createRegistry();
    const wss = createModelContextWebsocketEndpoint({
      registry,
      serverBaseUrl: 'http://localhost:8081',
    })[MODEL_CONTEXT_ENDPOINT]!;

    function connectSocket({
      origin,
      remoteAddress = '127.0.0.1',
    }: { origin?: string; remoteAddress?: string } = {}) {
      const socket = new EventEmitter() as EventEmitter & { send: jest.Mock };
      const replies: any[] = [];
      socket.send = jest.fn((data: string) => replies.push(JSON.parse(data)));
      const request = {
        headers: origin ? { origin } : {},
        socket: { remoteAddress, localAddress: '127.0.0.1', remoteFamily: 'IPv4' },
      } as unknown as IncomingMessage;
      wss.emit('connection', socket as unknown as WebSocket, request);

      let nextId = 1;
      const send = (message: Record<string, unknown>) =>
        socket.emit('message', Buffer.from(JSON.stringify({ version: 2, ...message })), false);
      const call = async (method: string, params: unknown) => {
        const id = `req-${nextId++}`;
        send({ id, method, params });
        // Handlers await the owner resolver, so give the event loop a few turns.
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setImmediate(resolve));
          const reply = replies.find((message) => message.id === id);
          if (reply) return reply;
        }
        throw new Error(`No reply to ${method}`);
      };
      return { socket, replies, send, call, close: () => socket.emit('close') };
    }

    return { registry, wss, connectSocket };
  }

  it('registers, calls and unregisters a tool over the socket', async () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket();

    expect(
      await client.call('modelContext/hello', { protocolVersion: 1, platform: 'ios' })
    ).toEqual({
      version: 2,
      id: 'req-1',
      result: { ok: true },
    });
    expect(await client.call('modelContext/registerTool', TODO_TOOL)).toMatchObject({
      result: { name: 'add-todo', status: 'allowed' },
    });

    // The app answers the forwarded `tools/call`.
    const pending = registry.callToolAsync('app__add-todo', { text: 'milk' });
    const forwarded = client.replies.find((message) => message.method === 'tools/call');
    expect(forwarded).toMatchObject({ params: { name: 'add-todo', arguments: { text: 'milk' } } });
    client.send({ id: forwarded.id, result: { content: [{ type: 'text', text: 'got milk' }] } });
    await expect(pending).resolves.toEqual({ content: [{ type: 'text', text: 'got milk' }] });

    expect(await client.call('modelContext/unregisterTool', { name: 'add-todo' })).toMatchObject({
      result: { removed: true },
    });
    expect(registry.listTools()).toHaveLength(0);
  });

  it('rejects invalid params and unknown methods', async () => {
    const { registry, connectSocket } = createHarness();
    const client = connectSocket();
    await client.call('modelContext/hello', { protocolVersion: 1 });

    expect(
      await client.call('modelContext/registerTool', { ...TODO_TOOL, name: 'bad name!' })
    ).toMatchObject({ error: { code: -32602, message: expect.stringMatching(/name/) } });
    expect(
      await client.call('modelContext/registerTool', {
        ...TODO_TOOL,
        inputSchema: { type: 'object', properties: { a: { $ref: '#/x' } } },
      })
    ).toMatchObject({ error: { message: expect.stringMatching(/\$ref/) } });
    expect(await client.call('nope', {})).toMatchObject({ error: { code: -32601 } });
    expect(registry.listTools()).toHaveLength(0);
  });

  it('ignores binary frames, malformed JSON and messages without the envelope version', async () => {
    const { connectSocket } = createHarness();
    const client = connectSocket();
    client.socket.emit('message', Buffer.from('binary'), true);
    client.socket.emit('message', Buffer.from('{not json'), false);
    client.socket.emit('message', Buffer.from('{"id":1,"method":"modelContext/hello"}'), false);
    await new Promise((resolve) => setImmediate(resolve));
    expect(client.replies).toHaveLength(0);
  });

  it('marks connections from another origin or host as untrusted and cleans up on close', async () => {
    const { registry, connectSocket } = createHarness();
    for (const client of [
      connectSocket({ origin: 'http://evil.example' }),
      connectSocket({ remoteAddress: '192.168.1.20' }),
    ]) {
      await client.call('modelContext/hello', { protocolVersion: 1 });
      expect(await client.call('modelContext/registerTool', TODO_TOOL)).toMatchObject({
        result: { status: 'blocked', reason: 'untrusted-connection' },
      });
      client.close();
    }
    expect(registry.getConnectionCount()).toBe(0);
    expect(registry.listTools()).toHaveLength(0);
  });
});
