import { ModelContextClient, type ModelContextSocket } from '../ModelContextClient';

/** Mimics `WebSocketWithReconnect`: queues sends until open, fires `open` on every (re)connect. */
class FakeWebSocket implements ModelContextSocket {
  static instances: FakeWebSocket[] = [];
  readyState: 0 | 1 | 2 | 3 = 0;
  sent: any[] = [];
  private queue: string[] = [];
  private listeners: Record<string, Set<(event: any) => void>> = {};

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    if (this.readyState === 1) {
      this.sent.push(JSON.parse(data));
    } else {
      this.queue.push(data);
    }
  }

  close() {
    this.readyState = 3;
  }

  addEventListener(event: string, listener: (event: any) => void) {
    (this.listeners[event] ??= new Set()).add(listener);
  }

  removeEventListener(event: string, listener: (event: any) => void) {
    this.listeners[event]?.delete(listener);
  }

  open() {
    this.readyState = 1;
    this.listeners.open?.forEach((listener) => listener(undefined));
    const queue = this.queue;
    this.queue = [];
    for (const data of queue) this.send(data);
  }

  reconnect() {
    this.sent = [];
    this.open();
  }

  receive(message: unknown) {
    this.listeners.message?.forEach((listener) => listener({ data: JSON.stringify(message) }));
  }

  async flush() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const TOOL = {
  name: 'add-todo',
  description: 'Add a todo',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
  execute: jest.fn(async ({ text }: { text: string }) => ({
    content: [{ type: 'text' as const, text: `Added ${text}` }],
  })),
};

function createClient() {
  return new ModelContextClient({
    getConnectionInfo: () => ({ devServer: 'localhost:8081', useWss: false }),
    createWebSocket: (url) => new FakeWebSocket(url),
    platform: 'ios',
  });
}

describe(ModelContextClient, () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    TOOL.execute.mockClear();
  });

  it('connects on first registration and sends hello plus registrations on open', () => {
    const client = createClient();
    client.registerTool(TOOL);
    expect(FakeWebSocket.instances).toHaveLength(1);
    const ws = FakeWebSocket.instances[0]!;
    expect(ws.url).toBe('ws://localhost:8081/_expo/model-context');
    expect(ws.sent).toHaveLength(0);

    ws.open();
    expect(ws.sent[0]).toMatchObject({
      version: 2,
      method: 'modelContext/hello',
      params: { protocolVersion: 1, platform: 'ios' },
    });
    expect(ws.sent[1]).toMatchObject({
      method: 'modelContext/registerTool',
      params: {
        name: 'add-todo',
        description: 'Add a todo',
        inputSchema: TOOL.inputSchema,
        stack: expect.stringContaining('ModelContextClient'),
      },
    });
    expect(ws.sent).toHaveLength(2);
  });

  it('uses wss when the dev server is served over https', () => {
    new ModelContextClient({
      getConnectionInfo: () => ({ devServer: 'example.dev', useWss: true }),
      createWebSocket: (url) => new FakeWebSocket(url),
    }).registerTool(TOOL);
    expect(FakeWebSocket.instances[0]!.url).toBe('wss://example.dev/_expo/model-context');
  });

  it('runs the tool on tools/call and replies with the result', async () => {
    const client = createClient();
    client.registerTool(TOOL);
    const ws = FakeWebSocket.instances[0]!;
    ws.open();

    ws.receive({
      version: 2,
      id: 'call-1',
      method: 'tools/call',
      params: { name: 'add-todo', arguments: { text: 'milk' }, timeoutMs: 1000 },
    });
    await ws.flush();

    expect(TOOL.execute).toHaveBeenCalledWith(
      { text: 'milk' },
      { signal: expect.any(AbortSignal) }
    );
    expect(ws.sent.at(-1)).toEqual({
      version: 2,
      id: 'call-1',
      result: { content: [{ type: 'text', text: 'Added milk' }] },
    });
  });

  it('ignores messages without the socket envelope version', async () => {
    const client = createClient();
    client.registerTool(TOOL);
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    ws.receive({ id: 'x', method: 'tools/call', params: { name: 'add-todo', arguments: {} } });
    await ws.flush();
    expect(TOOL.execute).not.toHaveBeenCalled();
    expect(ws.sent).toHaveLength(2);
  });

  it('replies with errors for unknown tools and thrown errors', async () => {
    const client = createClient();
    client.registerTool({
      ...TOOL,
      name: 'fails',
      execute: async () => {
        throw new Error('nope');
      },
    });
    const ws = FakeWebSocket.instances[0]!;
    ws.open();

    ws.receive({ version: 2, id: 1, method: 'tools/call', params: { name: 'missing' } });
    await ws.flush();
    expect(ws.sent.at(-1)).toMatchObject({ id: 1, error: { code: -32601 } });

    ws.receive({ version: 2, id: 2, method: 'tools/call', params: { name: 'fails' } });
    await ws.flush();
    expect(ws.sent.at(-1)).toMatchObject({ id: 2, error: { code: -32000, message: 'nope' } });
  });

  it('unregisters through the subscription and the abort signal', () => {
    const client = createClient();
    const controller = new AbortController();
    const subscription = client.registerTool(TOOL);
    client.registerTool({ ...TOOL, name: 'second' }, { signal: controller.signal });
    const ws = FakeWebSocket.instances[0]!;
    ws.open();

    subscription.remove();
    expect(ws.sent.at(-1)).toMatchObject({
      method: 'modelContext/unregisterTool',
      params: { name: 'add-todo' },
    });
    controller.abort();
    expect(ws.sent.at(-1)).toMatchObject({
      method: 'modelContext/unregisterTool',
      params: { name: 'second' },
    });
    expect(client.getTools()).toHaveLength(0);
  });

  it('registers later tools on the open socket', () => {
    const client = createClient();
    client.registerTool(TOOL);
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    client.registerTool({ ...TOOL, name: 'second' });
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(ws.sent.at(-1)).toMatchObject({
      method: 'modelContext/registerTool',
      params: { name: 'second' },
    });
  });

  it('re-sends hello and every registration when the socket reconnects', () => {
    const client = createClient();
    client.registerTool(TOOL);
    client.registerTool({ ...TOOL, name: 'second' });
    const ws = FakeWebSocket.instances[0]!;
    ws.open();

    ws.reconnect();
    expect(ws.sent.map((message) => message.method)).toEqual([
      'modelContext/hello',
      'modelContext/registerTool',
      'modelContext/registerTool',
    ]);
  });

  it('validates tools locally', () => {
    const client = createClient();
    expect(() => client.registerTool({ ...TOOL, name: 'bad name' })).toThrow(/Invalid tool name/);
    expect(() => client.registerTool({ ...TOOL, description: '' })).toThrow(/description/);
    expect(() => client.registerTool({ ...TOOL, execute: undefined as any })).toThrow(/execute/);
    expect(FakeWebSocket.instances).toHaveLength(0);
  });
});
