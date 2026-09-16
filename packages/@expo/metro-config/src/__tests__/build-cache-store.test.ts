import { Cache } from '@expo/metro/metro-cache';
import { vol } from 'memfs';

import { FileStore } from '../binary-file-store';
import { BuildCacheStore } from '../build-cache-store';

const key = Buffer.from('aabb', 'hex');
const value = { code: 'unchanged' };

describe(BuildCacheStore, () => {
  afterEach(() => vol.reset());

  it('writes only to output and preserves it across instances', async () => {
    const store = new BuildCacheStore({
      restoredRoot: '/cache/restored',
      outputRoot: '/cache/output',
    });
    await store.set(key, value);
    expect(await new FileStore({ root: '/cache/restored' }).get(key)).toBeNull();
    expect(
      await new BuildCacheStore({
        restoredRoot: '/cache/restored',
        outputRoot: '/cache/output',
      }).get(key)
    ).toEqual(value);
  });

  it('prefers output over restored entries', async () => {
    await new FileStore({ root: '/cache/restored' }).set(key, { code: 'old' });
    const store = new BuildCacheStore({
      restoredRoot: '/cache/restored',
      outputRoot: '/cache/output',
    });
    await store.set(key, value);
    expect(await store.get(key)).toEqual(value);
  });

  it('preserves the binary store cache exclusion rules', async () => {
    const store = new BuildCacheStore({
      restoredRoot: '/cache/restored',
      outputRoot: '/cache/output',
    });
    await store.set(key, { output: [{ data: { skipCache: true } }] });
    expect(await store.get(key)).toBeNull();
  });

  it.each([true, false])('collects another store hit only when placed first=%s', async (first) => {
    const store = new BuildCacheStore({
      restoredRoot: '/cache/restored',
      outputRoot: '/cache/output',
    });
    const other = { get: async () => value, set: async () => {}, clear() {} };
    const cache = new Cache(first ? [store, other] : [other, store]);
    expect(await cache.get(key)).toEqual(value);
    await cache.set(key, value);
    expect(await new FileStore({ root: '/cache/output' }).get(key)).toEqual(first ? value : null);
  });
});
