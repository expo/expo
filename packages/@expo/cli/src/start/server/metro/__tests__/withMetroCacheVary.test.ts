import { VaryingCacheStore } from '@expo/metro-config/build/cache-vary/VaryingCacheStore';
import { patchTransformFileForPackedMaps } from '@expo/metro-config/build/serializer/packedMap';
import DeltaCalculator from '@expo/metro/metro/DeltaBundler/DeltaCalculator';
import { EventEmitter } from 'node:events';

import {
  patchGetDeltaForCacheVary,
  patchTransformFileForCacheVary,
  resetAmbientValueTracking,
  withMetroCacheVary,
} from '../withMetroCacheVary';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  resetAmbientValueTracking();
});

afterAll(() => {
  process.env = { ...originalEnv };
});

function makeStore() {
  return {
    get: jest.fn(async () => null),
    set: jest.fn(async () => {}),
    clear: jest.fn(),
  };
}

function makeTransformResult(
  key: string | null,
  dims?: { scheme: string; name: string; fp: string }[]
) {
  return {
    unstable_transformResultKey: key,
    dependencies: [],
    output: [{ data: { code: 'code', ...(dims ? { expoCacheVary: dims } : {}) } }],
  };
}

async function observeResult(result: any) {
  const bundler = { transformFile: jest.fn(async () => result) } as any;
  patchTransformFileForCacheVary(bundler);
  return bundler.transformFile('/file.js', {} as any);
}

describe(withMetroCacheVary, () => {
  it('wraps every resolved cache store', () => {
    const stores = [makeStore(), makeStore()];
    const config = { cacheStores: stores } as any;

    const result = withMetroCacheVary(config);

    expect(result.cacheStores).toHaveLength(2);
    for (const store of result.cacheStores) {
      expect(store).toBeInstanceOf(VaryingCacheStore);
    }
  });

  it('does not double-wrap stores that are already varying cache stores', () => {
    const store = new VaryingCacheStore(makeStore());
    const config = { cacheStores: [store] } as any;

    const result = withMetroCacheVary(config);

    expect(result.cacheStores).toEqual([store]);
  });

  it('delegates get/set to the wrapped store', async () => {
    const inner = makeStore();
    const config = withMetroCacheVary({ cacheStores: [inner] } as any);
    const key = Buffer.alloc(20, 1);

    await config.cacheStores[0]!.get(key);
    expect(inner.get).toHaveBeenCalledWith(key);
  });

  it('returns the config unchanged when EXPO_NO_CACHE_VARY is set', () => {
    process.env.EXPO_NO_CACHE_VARY = '1';
    const config = { cacheStores: [makeStore()] } as any;

    expect(withMetroCacheVary(config)).toBe(config);
  });
});

describe(patchTransformFileForCacheVary, () => {
  const dims = [{ scheme: 'env', name: 'EXPO_PUBLIC_A', fp: 'abc' }];

  it('suffixes the transform result key deterministically from the embedded dims', async () => {
    const first = await observeResult(makeTransformResult('base-key', dims));
    const second = await observeResult(makeTransformResult('base-key', dims));

    expect(first.unstable_transformResultKey).toMatch(/^base-key::[0-9a-f]{40}$/);
    expect(second.unstable_transformResultKey).toBe(first.unstable_transformResultKey);
  });

  it('produces a different key when the embedded fps change', async () => {
    const first = await observeResult(makeTransformResult('base-key', dims));
    const changed = await observeResult(
      makeTransformResult('base-key', [{ scheme: 'env', name: 'EXPO_PUBLIC_A', fp: 'other' }])
    );

    expect(changed.unstable_transformResultKey).not.toBe(first.unstable_transformResultKey);
  });

  it('returns non-varying results untouched, preserving object identity', async () => {
    const original = makeTransformResult('base-key');
    await expect(observeResult(original)).resolves.toBe(original);
  });

  it('preserves the output/data object identity of varying results', async () => {
    const original = makeTransformResult('base-key', dims);
    const result = await observeResult(original);

    // Sibling instance patches (packedMap) install fields on `data` — only the top level may
    // be copied for the key rewrite.
    expect(result.output).toBe(original.output);
  });

  it('leaves results without a transform result key untouched', async () => {
    const original = makeTransformResult(null, dims);
    await expect(observeResult(original)).resolves.toBe(original);
  });

  it('is idempotent — patching twice wraps once', async () => {
    const bundler = {
      transformFile: jest.fn(async () => makeTransformResult('base-key', dims)),
    } as any;

    patchTransformFileForCacheVary(bundler);
    const patchedTransformFile = bundler.transformFile;
    patchTransformFileForCacheVary(bundler);

    const result = await bundler.transformFile('/file.js', {} as any);

    expect(bundler.transformFile).toBe(patchedTransformFile);
    expect(result.unstable_transformResultKey).toMatch(/^base-key::[0-9a-f]{40}$/);
    expect(result.unstable_transformResultKey).not.toMatch(/::[0-9a-f]{40}::[0-9a-f]{40}$/);
  });

  it('does nothing when EXPO_NO_CACHE_VARY is set', () => {
    process.env.EXPO_NO_CACHE_VARY = '1';
    const bundler = {
      transformFile: jest.fn(async () => makeTransformResult('base-key')),
    } as any;
    const before = bundler.transformFile;
    patchTransformFileForCacheVary(bundler);

    expect(bundler.transformFile).toBe(before);
  });

  it('composes with the packedMap transformFile patch in production order', async () => {
    const original = {
      unstable_transformResultKey: 'base-key',
      dependencies: [],
      output: [
        {
          data: {
            code: 'code',
            lineCount: 1,
            map: { __version: 1, __count: 0, __packed: [], __names: [] },
            expoCacheVary: dims,
          },
        },
      ],
    };
    const bundler = { transformFile: jest.fn(async () => original) } as any;

    patchTransformFileForPackedMaps(bundler);
    patchTransformFileForCacheVary(bundler);

    const result = await bundler.transformFile('/file.js', {} as any);

    expect(result.unstable_transformResultKey).toMatch(/^base-key::[0-9a-f]{40}$/);
    expect(result.output[0].data.expoCacheVary).toEqual(dims);
    expect(Array.isArray(result.output[0].data.map)).toBe(true);
  });
});

describe(patchGetDeltaForCacheVary, () => {
  function graphModule(dims?: { scheme: string; name: string; fp: string }[]) {
    return {
      output: [{ data: { code: 'code', ...(dims ? { expoCacheVary: dims } : {}) } }],
    };
  }

  const envDim = (name: string) => ({ scheme: 'env', name, fp: 'fp' });

  function makeDeltaCalculator() {
    patchGetDeltaForCacheVary();

    const calculator = new (DeltaCalculator as any)(new Set<string>(), new EventEmitter(), {
      transformOptions: {},
    });
    const getChangedDependencies = jest.fn(async () => ({
      added: new Map(),
      modified: new Map(),
      deleted: new Set(),
    }));
    calculator._getChangedDependencies = getChangedDependencies;
    return { calculator, getChangedDependencies };
  }

  it('marks graphed modules whose observed env values changed', async () => {
    process.env.EXPO_PUBLIC_OBSERVED = 'one';
    await observeResult(makeTransformResult('k', [envDim('EXPO_PUBLIC_OBSERVED')]));

    const { calculator, getChangedDependencies } = makeDeltaCalculator();
    calculator._graph.dependencies.set(
      '/uses-env.js',
      graphModule([envDim('EXPO_PUBLIC_OBSERVED')])
    );
    calculator._graph.dependencies.set('/plain.js', graphModule());

    await calculator.getDelta({ reset: false, shallow: false });
    expect(getChangedDependencies).toHaveBeenLastCalledWith(new Set(), new Set(), new Set());

    process.env.EXPO_PUBLIC_OBSERVED = 'two';
    await calculator.getDelta({ reset: false, shallow: false });

    expect(getChangedDependencies).toHaveBeenLastCalledWith(
      new Set(['/uses-env.js']),
      new Set(),
      new Set()
    );
  });

  it('marks only modules whose dim names intersect the changed values', async () => {
    process.env.EXPO_PUBLIC_CHANGING = 'one';
    process.env.EXPO_PUBLIC_STABLE = 'same';
    await observeResult(
      makeTransformResult('k', [envDim('EXPO_PUBLIC_CHANGING'), envDim('EXPO_PUBLIC_STABLE')])
    );

    const { calculator, getChangedDependencies } = makeDeltaCalculator();
    calculator._graph.dependencies.set(
      '/changing.js',
      graphModule([envDim('EXPO_PUBLIC_CHANGING')])
    );
    calculator._graph.dependencies.set('/stable.js', graphModule([envDim('EXPO_PUBLIC_STABLE')]));
    await calculator.getDelta({ reset: false, shallow: false });

    process.env.EXPO_PUBLIC_CHANGING = 'two';
    await calculator.getDelta({ reset: false, shallow: false });

    expect(getChangedDependencies).toHaveBeenLastCalledWith(
      new Set(['/changing.js']),
      new Set(),
      new Set()
    );
  });

  it('detects changes that happened between observation and the first scan', async () => {
    process.env.EXPO_PUBLIC_EARLY = 'one';
    await observeResult(makeTransformResult('k', [envDim('EXPO_PUBLIC_EARLY')]));

    process.env.EXPO_PUBLIC_EARLY = 'two';
    const { calculator, getChangedDependencies } = makeDeltaCalculator();
    calculator._graph.dependencies.set('/early.js', graphModule([envDim('EXPO_PUBLIC_EARLY')]));

    await calculator.getDelta({ reset: false, shallow: false });
    expect(getChangedDependencies).toHaveBeenLastCalledWith(
      new Set(['/early.js']),
      new Set(),
      new Set()
    );
  });

  it('tracks a baseline per calculator so every graph observes the change', async () => {
    process.env.EXPO_PUBLIC_SHARED = 'one';
    await observeResult(makeTransformResult('k', [envDim('EXPO_PUBLIC_SHARED')]));

    const first = makeDeltaCalculator();
    const second = makeDeltaCalculator();
    for (const { calculator } of [first, second]) {
      calculator._graph.dependencies.set('/shared.js', graphModule([envDim('EXPO_PUBLIC_SHARED')]));
      await calculator.getDelta({ reset: false, shallow: false });
    }

    process.env.EXPO_PUBLIC_SHARED = 'two';
    await first.calculator.getDelta({ reset: false, shallow: false });
    await second.calculator.getDelta({ reset: false, shallow: false });

    expect(first.getChangedDependencies).toHaveBeenLastCalledWith(
      new Set(['/shared.js']),
      new Set(),
      new Set()
    );
    expect(second.getChangedDependencies).toHaveBeenLastCalledWith(
      new Set(['/shared.js']),
      new Set(),
      new Set()
    );
  });

  it('ignores dims of schemes other than env', async () => {
    await observeResult(makeTransformResult('k', [{ scheme: 'custom', name: 'x', fp: 'f' }]));

    const { calculator, getChangedDependencies } = makeDeltaCalculator();
    calculator._graph.dependencies.set(
      '/custom.js',
      graphModule([{ scheme: 'custom', name: 'x', fp: 'f' }])
    );

    await calculator.getDelta({ reset: false, shallow: false });
    expect(getChangedDependencies).toHaveBeenLastCalledWith(new Set(), new Set(), new Set());
  });

  it('is idempotent — patching twice wraps once', async () => {
    patchGetDeltaForCacheVary();
    const patchedGetDelta = (DeltaCalculator.prototype as any).getDelta;
    patchGetDeltaForCacheVary();

    expect((DeltaCalculator.prototype as any).getDelta).toBe(patchedGetDelta);
  });

  it('does nothing when EXPO_NO_CACHE_VARY is set', () => {
    process.env.EXPO_NO_CACHE_VARY = '1';
    const before = (DeltaCalculator.prototype as any).getDelta;
    patchGetDeltaForCacheVary();

    expect((DeltaCalculator.prototype as any).getDelta).toBe(before);
  });

  describe('against the real Metro DeltaCalculator', () => {
    it('marks changed modules through the real getDelta', async () => {
      process.env.EXPO_PUBLIC_REAL_DC_TEST = 'one';
      await observeResult(makeTransformResult('k', [envDim('EXPO_PUBLIC_REAL_DC_TEST')]));

      patchGetDeltaForCacheVary();

      const calculator = new (DeltaCalculator as any)(new Set<string>(), new EventEmitter(), {
        transformOptions: {},
      });
      expect(calculator._graph.dependencies).toBeInstanceOf(Map);
      expect(calculator._modifiedFiles).toBeInstanceOf(Set);

      calculator._graph.dependencies.set(
        '/stale.js',
        graphModule([envDim('EXPO_PUBLIC_REAL_DC_TEST')])
      );
      calculator._graph.dependencies.set('/plain.js', graphModule());

      const getChangedDependencies = jest.fn(async () => ({
        added: new Map(),
        modified: new Map(),
        deleted: new Set(),
      }));
      calculator._getChangedDependencies = getChangedDependencies;

      await calculator.getDelta({ reset: false, shallow: false });
      process.env.EXPO_PUBLIC_REAL_DC_TEST = 'two';
      await calculator.getDelta({ reset: false, shallow: false });

      expect(getChangedDependencies).toHaveBeenLastCalledWith(
        new Set(['/stale.js']),
        new Set(),
        new Set()
      );
    });
  });
});
