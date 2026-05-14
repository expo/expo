import { vol } from 'memfs';

import { FileStore } from '../binary-file-store';

const ROOT = '/cache';

function makeKey(byte = 0xab): Buffer {
  const key = Buffer.alloc(32);
  key[0] = byte;
  for (let i = 1; i < key.length; i++) key[i] = i;
  return key;
}

describe(FileStore, () => {
  beforeEach(() => {
    vol.fromJSON({}, '/');
  });
  afterEach(() => vol.reset());

  it('round-trips JSON-shaped values', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    const key = makeKey();
    const value = {
      path: '/src/index.ts',
      output: [{ data: { code: 'export {};', lineCount: 1 } }],
      dependencies: ['react', 'react-native'],
      nested: { a: 1, b: [true, false, null], c: 'string' },
    };

    await store.set(key, value);
    await expect(store.get(key)).resolves.toEqual(value);
  });

  it('round-trips binary Buffer values', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    const key = makeKey(0x01);
    const value = {
      bytecode: Buffer.from([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02, 0xff]),
      meta: { length: 8 },
    };

    await store.set(key, value);
    const result = (await store.get(key)) as typeof value;
    expect(Buffer.isBuffer(result.bytecode)).toBe(true);
    expect(result.bytecode.equals(value.bytecode)).toBe(true);
    expect(result.meta).toEqual(value.meta);
  });

  it('creates intermediate directories on first write', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    const key = makeKey(0x42);

    await store.set(key, { hello: 'world' });

    const shard = key.subarray(0, 1).toString('hex');
    const file = key.subarray(1).toString('hex') + '.mp';
    expect(vol.existsSync(`${ROOT}/${shard}/${file}`)).toBe(true);
  });

  it('returns null for a missing key', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    await expect(store.get(makeKey(0x99))).resolves.toBeNull();
  });

  it('skips writes flagged with css.skipCache', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    const key = makeKey(0x77);

    await store.set(key, { output: [{ data: { css: { skipCache: true } } }] });

    await expect(store.get(key)).resolves.toBeNull();
  });

  it('recovers when the cache root disappears between writes', async () => {
    const store = new FileStore<unknown>({ root: ROOT });
    const key1 = makeKey(0x01);
    const key2 = makeKey(0x02);

    await store.set(key1, { first: true });
    // Simulate a parallel `expo start --clear` (or any external removal)
    // wiping the cache root while this process kept its store instance.
    vol.rmSync(ROOT, { recursive: true, force: true });

    await store.set(key2, { second: true });

    await expect(store.get(key2)).resolves.toEqual({ second: true });
  });
});
