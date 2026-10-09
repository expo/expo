import type * as SQLiteModule from '../index';

jest.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: jest.fn(),
}));

class MockWorker {
  static instances: MockWorker[] = [];
  postMessage = jest.fn();
  addEventListener = jest.fn();
  constructor() {
    MockWorker.instances.push(this);
  }
}

// The Node project also runs `.web` tests to cover server rendering, where there is no worker.
const isServer = typeof window === 'undefined';

(isServer ? describe.skip : describe)('Configuring web', () => {
  let SQLite: typeof SQLiteModule;

  beforeEach(() => {
    MockWorker.instances = [];
    (globalThis as any).Worker = MockWorker;
    // `registerWebModule` caches the instance globally, which would keep the worker from the previous test.
    delete (globalThis as any).expo?.modules?.SQLiteModule;
    jest.isolateModules(() => {
      SQLite = require('../index');
    });
  });

  afterEach(() => {
    delete (globalThis as any).Worker;
  });

  async function startWorkerAsync(): Promise<MockWorker> {
    // The mock worker never replies, so the open never resolves. Wait until it has posted messages instead.
    SQLite.openDatabaseAsync(':memory:').catch(() => {});
    for (let i = 0; i < 20 && MockWorker.instances.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(MockWorker.instances).toHaveLength(1);
    return MockWorker.instances[0]!;
  }

  it('should configure the worker with a null url by default', async () => {
    const worker = await startWorkerAsync();
    expect(worker.postMessage.mock.calls[0][0]).toEqual({
      type: 'configure',
      data: { wasmURL: null },
    });
  });

  it('should configure the worker with the custom wasm url before any request', async () => {
    SQLite.configureWeb({ wasmURL: '/sqlite/wa-sqlite-fts.wasm' });
    const worker = await startWorkerAsync();
    expect(worker.postMessage.mock.calls[0][0]).toEqual({
      type: 'configure',
      data: { wasmURL: '/sqlite/wa-sqlite-fts.wasm' },
    });
    expect(worker.postMessage.mock.calls[1][0].type).toBe('open');
  });

  it('should use the options from the last call when called more than once', async () => {
    SQLite.configureWeb({ wasmURL: '/first.wasm' });
    SQLite.configureWeb({ wasmURL: '/second.wasm' });
    const worker = await startWorkerAsync();
    expect(worker.postMessage.mock.calls[0][0].data.wasmURL).toBe('/second.wasm');
  });

  it('should fall back to the default wasm when wasmURL is omitted', async () => {
    SQLite.configureWeb({ wasmURL: '/first.wasm' });
    SQLite.configureWeb({});
    const worker = await startWorkerAsync();
    expect(worker.postMessage.mock.calls[0][0].data.wasmURL).toBeNull();
  });

  it('should throw when called after a database is opened', async () => {
    await startWorkerAsync();
    expect(() => SQLite.configureWeb({ wasmURL: '/late.wasm' })).toThrow(
      /before opening any database/
    );
  });
});

(isServer ? describe : describe.skip)('Configuring web on the server', () => {
  it('should do nothing when rendering on the server', () => {
    const SQLite: typeof SQLiteModule = require('../index');
    expect(() => SQLite.configureWeb({ wasmURL: '/sqlite/wa-sqlite-fts.wasm' })).not.toThrow();
  });
});
