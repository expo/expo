const { AccessHandlePoolVFS } = require('../../web/wa-sqlite/AccessHandlePoolVFS');

const describeWeb = typeof window !== 'undefined' ? describe : describe.skip;

describeWeb('AccessHandlePoolVFS', () => {
  afterEach(() => {
    delete (globalThis.navigator as unknown as { storage?: unknown }).storage;
    jest.restoreAllMocks();
  });

  it('should close access handles that opened when another file is locked', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const accessHandle = {
      close: jest.fn(),
      read: jest.fn(() => 0),
      write: jest.fn(),
      flush: jest.fn(),
      truncate: jest.fn(),
    };
    let releaseFirst: (handle: typeof accessHandle) => void = () => {};
    const firstOpened = new Promise<typeof accessHandle>((resolve) => {
      releaseFirst = resolve;
    });
    const directory = {
      async *[Symbol.asyncIterator]() {
        yield ['pool-a', { kind: 'file', createSyncAccessHandle: () => firstOpened }];
        yield [
          'pool-b',
          {
            kind: 'file',
            createSyncAccessHandle: () => Promise.reject(new Error('locked')),
          },
        ];
      },
    };
    Object.defineProperty(globalThis.navigator, 'storage', {
      configurable: true,
      value: {
        getDirectory: async () => ({
          getDirectoryHandle: async () => directory,
        }),
      },
    });

    const created = AccessHandlePoolVFS.create('expo-sqlite', {});
    // The rejected open fails the pool while the other open is still pending.
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseFirst(accessHandle);
    await expect(created).rejects.toThrow(/locked/);
    expect(accessHandle.close).toHaveBeenCalledTimes(1);
  });
});
