import crypto from 'crypto';
import { vol } from 'memfs';

import { VaryingCacheStore } from '../VaryingCacheStore';
import { FileStore } from '../../binary-file-store';

const ROOT = '/cache';

function makeKey(byte = 0xab): Buffer {
  const key = Buffer.alloc(32);
  key[0] = byte;
  for (let i = 1; i < key.length; i++) key[i] = i;
  return key;
}

const sha1 = (value: string) => crypto.createHash('sha1').update(value).digest('hex');
const fingerprintEnv = (name: string) =>
  sha1(process.env[name] === undefined ? '' : JSON.stringify(process.env[name]));

function makeTransformResult(code: string, dims?: [name: string, fp: string][]) {
  return {
    dependencies: [],
    output: [
      {
        data: {
          code,
          lineCount: 1,
          ...(dims?.length
            ? {
                expoCacheVary: dims.map(([name, fp]) => ({
                  scheme: 'env',
                  name,
                  fp,
                })),
              }
            : {}),
        },
        type: 'js/module',
      },
    ],
  };
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  vol.fromJSON({}, '/');
});

afterEach(() => {
  vol.reset();
  process.env = { ...originalEnv };
});

function makeStores() {
  const inner = new FileStore<unknown>({ root: ROOT });
  const store = new VaryingCacheStore<unknown>(inner);
  return { inner, store };
}

function variantCachePaths(key: Buffer): string[] {
  const basePath = `${ROOT}/${key.subarray(0, 1).toString('hex')}/${key.subarray(1).toString('hex')}.mp`;
  return Object.keys(vol.toJSON()).filter(
    (p) => p.startsWith(`${ROOT}/`) && p.endsWith('.mp') && !p.includes('.tmp') && p !== basePath
  );
}

describe('non-varying modules', () => {
  it('passes values through raw, byte-identical to the inner store', async () => {
    const { inner, store } = makeStores();
    const key = makeKey();
    const artifact = makeTransformResult('no-env');

    await store.set(key, artifact);
    await expect(inner.get(key)).resolves.toEqual(artifact);
    await expect(store.get(key)).resolves.toEqual(artifact);
  });

  it('misses with a single inner read', async () => {
    const { inner, store } = makeStores();
    const getSpy = jest.spyOn(inner, 'get');

    await expect(store.get(makeKey(0x01))).resolves.toBeNull();
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});

describe('varying modules', () => {
  it('bootstraps the base slot with a raw artifact and hits it with a single read', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://prod';
    const { inner, store } = makeStores();
    const key = makeKey();
    const artifact = makeTransformResult('prod-code', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);

    await expect(store.get(key)).resolves.toBeNull();
    await store.set(key, artifact);
    await expect(inner.get(key)).resolves.toEqual(artifact);
    const getSpy = jest.spyOn(inner, 'get');
    await expect(store.get(key)).resolves.toEqual(artifact);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('writes non-base variants at their self-derived address, leaving the base untouched', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://prod';
    const { inner, store } = makeStores();
    const key = makeKey();
    const prodArtifact = makeTransformResult('prod-code', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.get(key);
    await store.set(key, prodArtifact);

    process.env.EXPO_PUBLIC_URL = 'https://staging';
    await expect(store.get(key)).resolves.toBeNull();
    const setSpy = jest.spyOn(inner, 'set');
    const stagingArtifact = makeTransformResult('staging-code', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, stagingArtifact);
    expect(setSpy).toHaveBeenCalledTimes(1);
    await expect(inner.get(key)).resolves.toEqual(prodArtifact);
    expect(variantCachePaths(key)).toHaveLength(1);
    await expect(store.get(key)).resolves.toEqual(stagingArtifact);
  });

  it('derives the variant address from the base dim names: 2-read hit, 2-IOPS miss', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://prod';
    const { inner, store } = makeStores();
    const key = makeKey();
    await store.get(key);
    await store.set(
      key,
      makeTransformResult('prod-code', [['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')]])
    );

    process.env.EXPO_PUBLIC_URL = 'https://staging';
    await store.get(key);
    const stagingArtifact = makeTransformResult('staging-code', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, stagingArtifact);
    const getSpy = jest.spyOn(inner, 'get');
    await expect(store.get(key)).resolves.toEqual(stagingArtifact);
    expect(getSpy).toHaveBeenCalledTimes(2);
    getSpy.mockClear();
    process.env.EXPO_PUBLIC_URL = 'https://preview';
    await expect(store.get(key)).resolves.toBeNull();
    expect(getSpy).toHaveBeenCalledTimes(2);
    getSpy.mockClear();
    process.env.EXPO_PUBLIC_URL = 'https://prod';
    await expect(store.get(key)).resolves.toEqual(
      makeTransformResult('prod-code', [['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')]])
    );
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('misses when only one of several dims mismatches (value-dependent values)', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://prod';
    process.env.EXPO_PUBLIC_FLAG = 'on';
    const { store } = makeStores();
    const key = makeKey();
    await store.get(key);
    await store.set(
      key,
      makeTransformResult('two-dims', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
      ])
    );

    process.env.EXPO_PUBLIC_FLAG = 'off';
    await expect(store.get(key)).resolves.toBeNull();
  });

  it('retains every distinct env until TTL — no truncation, all variants resolvable', async () => {
    const { store } = makeStores();
    const key = makeKey();

    for (const value of ['a', 'b', 'c', 'd']) {
      process.env.EXPO_PUBLIC_URL = value;
      await store.get(key);
      await store.set(
        key,
        makeTransformResult(`code-${value}`, [
          ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ])
      );
    }

    for (const value of ['a', 'b', 'c', 'd']) {
      process.env.EXPO_PUBLIC_URL = value;
      await expect(store.get(key)).resolves.toEqual(
        makeTransformResult(`code-${value}`, [
          ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ])
      );
    }
  });

  it('re-creates an evicted variant with a single idempotent write, base untouched', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    await store.get(key);
    await store.set(
      key,
      makeTransformResult('code-a', [['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')]])
    );

    process.env.EXPO_PUBLIC_URL = 'b';
    await store.get(key);
    await store.set(
      key,
      makeTransformResult('code-b', [['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')]])
    );
    vol.rmSync(variantCachePaths(key)[0]!);
    await expect(store.get(key)).resolves.toBeNull();

    const setSpy = jest.spyOn(inner, 'set');
    const baseBefore = await inner.get(key);
    const rebuilt = makeTransformResult('code-b2', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, rebuilt);

    expect(setSpy).toHaveBeenCalledTimes(1);
    await expect(inner.get(key)).resolves.toEqual(baseBefore);
    await expect(store.get(key)).resolves.toEqual(rebuilt);
  });

  it('settles two same-cache processes with different envs without shared-cell writes', async () => {
    const inner = new FileStore<unknown>({ root: ROOT });
    const storeA = new VaryingCacheStore<unknown>(inner);
    const storeB = new VaryingCacheStore<unknown>(inner);
    const key = makeKey();

    process.env.EXPO_PUBLIC_URL = 'a';
    await storeA.get(key);
    const artifactA = makeTransformResult('code-a', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await storeA.set(key, artifactA);

    process.env.EXPO_PUBLIC_URL = 'b';
    await storeB.get(key);
    const artifactB = makeTransformResult('code-b', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    const setSpy = jest.spyOn(inner, 'set');
    await storeB.set(key, artifactB);
    expect(setSpy).toHaveBeenCalledTimes(1);
    await expect(inner.get(key)).resolves.toEqual(artifactA);
    await expect(storeB.get(key)).resolves.toEqual(artifactB);
    process.env.EXPO_PUBLIC_URL = 'a';
    await expect(storeB.get(key)).resolves.toEqual(artifactA);
    await expect(storeA.get(key)).resolves.toEqual(artifactA);
  });
});

describe('foreign data and degradation', () => {
  it('treats an unknown scheme in the base as a miss with a single read, never a throw', async () => {
    const { inner, store } = makeStores();
    const key = makeKey();

    await inner.set(key, {
      output: [
        {
          data: {
            code: 'x',
            expoCacheVary: [{ scheme: 'from-the-future', name: 'n', fp: 'f' }],
          },
        },
      ],
    });
    const getSpy = jest.spyOn(inner, 'get');
    await expect(store.get(key)).resolves.toBeNull();
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('treats a foreign wrapper at the base slot as a miss, never as a raw artifact', async () => {
    const { inner, store } = makeStores();
    const key = makeKey();
    await inner.set(key, {
      expoVaryHead: 1,
      value: makeTransformResult('older'),
      others: [],
    });

    await expect(store.get(key)).resolves.toBeNull();
    const artifact = makeTransformResult('healed');
    await store.set(key, artifact);
    await expect(store.get(key)).resolves.toEqual(artifact);
  });

  it('claims an empty base slot when no preceding miss was observed (backfill)', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    const getSpy = jest.spyOn(inner, 'get');
    const artifact = makeTransformResult('backfill', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, artifact);

    expect(getSpy).toHaveBeenCalledTimes(1);
    await expect(inner.get(key)).resolves.toEqual(artifact);
  });

  it('self-addresses when the memo is absent and the base belongs to another population', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    await store.get(key);
    const artifactA = makeTransformResult('code-a', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, artifactA);

    process.env.EXPO_PUBLIC_URL = 'b';
    const artifactB = makeTransformResult('code-b', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, artifactB);

    await expect(inner.get(key)).resolves.toEqual(artifactA);
    await expect(store.get(key)).resolves.toEqual(artifactB);
    process.env.EXPO_PUBLIC_URL = 'a';
    await expect(store.get(key)).resolves.toEqual(artifactA);
  });

  it('registers an unknown name-set when the memo is absent', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { store } = makeStores();
    const key = makeKey();
    await store.get(key);
    const oneDim = makeTransformResult('one-dim', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, oneDim);

    process.env.EXPO_PUBLIC_URL = 'b';
    process.env.EXPO_PUBLIC_FLAG = 'on';
    const twoDims = makeTransformResult('two-dims', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
      ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
    ]);
    await store.set(key, twoDims);

    await expect(store.get(key)).resolves.toEqual(twoDims);
    process.env.EXPO_PUBLIC_URL = 'a';
    await expect(store.get(key)).resolves.toEqual(oneDim);
  });

  it('propagates a failed recomputation read without claiming the base', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    jest.spyOn(inner, 'get').mockRejectedValueOnce(new Error('io'));
    const artifact = makeTransformResult('code-a', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await expect(store.set(key, artifact)).rejects.toThrow('io');

    await expect(inner.get(key)).resolves.toBeNull();
  });

  it('never throws on malformed vary metadata: the read barrier degrades to a miss', async () => {
    const { inner, store } = makeStores();
    const key = makeKey(0x0a);
    await inner.set(key, {
      output: [{ data: { code: 'x', expoCacheVary: [null] } }],
    });

    await expect(store.get(key)).resolves.toBeNull();
  });

  it('propagates a failed variant write, leaving the base untouched', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    const artifactA = makeTransformResult('code-a', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.get(key);
    await store.set(key, artifactA);

    process.env.EXPO_PUBLIC_URL = 'b';
    await store.get(key);
    jest.spyOn(inner, 'set').mockRejectedValueOnce(new Error('disk full'));
    const artifactB = makeTransformResult('code-b', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await expect(store.set(key, artifactB)).rejects.toThrow('disk full');
    await expect(store.get(key)).resolves.toBeNull();
    process.env.EXPO_PUBLIC_URL = 'a';
    await expect(store.get(key)).resolves.toEqual(artifactA);
  });

  it('passes css.skipCache values through as a full no-op, preserving the pending write target', async () => {
    process.env.EXPO_PUBLIC_URL = 'a';
    const { inner, store } = makeStores();
    const key = makeKey();
    await store.get(key);
    const artifact = makeTransformResult('base', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, artifact);
    process.env.EXPO_PUBLIC_URL = 'b';
    await store.get(key);
    await store.set(key, { output: [{ data: { css: { skipCache: true } } }] });

    const artifactB = makeTransformResult('code-b', [
      ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
    ]);
    await store.set(key, artifactB);
    await expect(inner.get(key)).resolves.toEqual(artifact);
    await expect(store.get(key)).resolves.toEqual(artifactB);
  });

  describe('dim-name contract violations (name-set registry fallback)', () => {
    it('keeps BOTH populations resolvable when a producer emits a different dim-name set', async () => {
      process.env.EXPO_PUBLIC_URL = 'a';
      process.env.EXPO_PUBLIC_FLAG = 'on';
      const { store } = makeStores();
      const key = makeKey();
      await store.get(key);
      const oneDim = makeTransformResult('one-dim', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
      ]);
      await store.set(key, oneDim);
      process.env.EXPO_PUBLIC_URL = 'b';
      await store.get(key);
      const twoDims = makeTransformResult('two-dims', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
      ]);
      await store.set(key, twoDims);
      await expect(store.get(key)).resolves.toEqual(twoDims);
      process.env.EXPO_PUBLIC_URL = 'a';
      await expect(store.get(key)).resolves.toEqual(oneDim);
      process.env.EXPO_PUBLIC_URL = 'c';
      process.env.EXPO_PUBLIC_FLAG = 'off';
      await store.get(key);
      const twoDimsC = makeTransformResult('two-dims-c', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
      ]);
      await store.set(key, twoDimsC);
      await expect(store.get(key)).resolves.toEqual(twoDimsC);
    });

    it('registers a name-set once, then self-addresses: no base-slot churn', async () => {
      process.env.EXPO_PUBLIC_URL = 'a';
      process.env.EXPO_PUBLIC_FLAG = 'on';
      const { inner, store } = makeStores();
      const key = makeKey();
      await store.get(key);
      await store.set(
        key,
        makeTransformResult('one-dim', [['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')]])
      );
      await store.get(key);
      await store.set(
        key,
        makeTransformResult('two-dims', [
          ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
          ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
        ])
      );
      const baseAfterRegistration = await inner.get(key);
      process.env.EXPO_PUBLIC_FLAG = 'off';
      await store.get(key);
      const setSpy = jest.spyOn(inner, 'set');
      await store.set(
        key,
        makeTransformResult('two-dims-2', [
          ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
          ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
        ])
      );
      expect(setSpy).toHaveBeenCalledTimes(1);
      await expect(inner.get(key)).resolves.toEqual(baseAfterRegistration);
    });

    it('resolves a non-varying population alongside a varying base (most-specific first)', async () => {
      process.env.EXPO_PUBLIC_URL = 'a';
      const { store } = makeStores();
      const key = makeKey();
      await store.get(key);
      const varying = makeTransformResult('varying', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
      ]);
      await store.set(key, varying);
      process.env.EXPO_PUBLIC_URL = 'other';
      await store.get(key);
      const plain = makeTransformResult('no-deps');
      await store.set(key, plain);
      process.env.EXPO_PUBLIC_URL = 'a';
      await expect(store.get(key)).resolves.toEqual(varying);
      process.env.EXPO_PUBLIC_URL = 'yet-another';
      await expect(store.get(key)).resolves.toEqual(plain);
    });

    it('serves a no-deps BASE artifact to every env by its own claim (under-description is a producer bug)', async () => {
      process.env.EXPO_PUBLIC_URL = 'a';
      const { store } = makeStores();
      const key = makeKey();
      await store.get(key);
      const plain = makeTransformResult('no-deps');
      await store.set(key, plain);
      process.env.EXPO_PUBLIC_URL = 'b';
      await expect(store.get(key)).resolves.toEqual(plain);
    });

    it('converges across two same-cache processes with violating producers', async () => {
      const inner = new FileStore<unknown>({ root: ROOT });
      const storeA = new VaryingCacheStore<unknown>(inner);
      const storeB = new VaryingCacheStore<unknown>(inner);
      const key = makeKey();

      process.env.EXPO_PUBLIC_URL = 'a';
      await storeA.get(key);
      const oneDim = makeTransformResult('one-dim', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
      ]);
      await storeA.set(key, oneDim);

      process.env.EXPO_PUBLIC_FLAG = 'on';
      await storeB.get(key);
      const twoDims = makeTransformResult('two-dims', [
        ['EXPO_PUBLIC_URL', fingerprintEnv('EXPO_PUBLIC_URL')],
        ['EXPO_PUBLIC_FLAG', fingerprintEnv('EXPO_PUBLIC_FLAG')],
      ]);
      await storeB.set(key, twoDims);
      await expect(storeA.get(key)).resolves.toEqual(oneDim);
      await expect(storeB.get(key)).resolves.toEqual(oneDim);
    });
  });

  it('clears the inner store', async () => {
    const { inner, store } = makeStores();
    const clearSpy = jest.spyOn(inner, 'clear').mockImplementation(() => {});

    await store.clear();
    expect(clearSpy).toHaveBeenCalled();
  });
});
