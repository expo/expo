import * as babel from '@babel/core';

import preset from '../..';
import type { CacheVaryDim } from '../../cache-vary';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  isHMREnabled: true,
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',
  babelrc: false,
  presets: [preset],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: true,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

type Metadata = {
  cacheVary?: CacheVaryDim[];
  publicEnvVars?: string[];
};

function transformGetMetadata(
  sourceCode: string,
  customOptions: { filename?: string; caller?: any; presets?: any[] } = {}
): Metadata {
  const results = babel.transform(sourceCode, { ...DEF_OPTIONS, ...customOptions });
  if (!results) throw new Error('Failed to transform code');
  return results.metadata as unknown as Metadata;
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

it(`records a cacheVary dim for each environment variable inlined in production`, () => {
  process.env.EXPO_PUBLIC_A = 'a';
  process.env.EXPO_PUBLIC_B = 'b';

  const metadata = transformGetMetadata(`
console.log(process.env.EXPO_PUBLIC_A);
console.log(process.env.EXPO_PUBLIC_B);
console.log(process.env.NODE_ENV);
console.log(process.env.JEST_WORKER_ID);
`);

  expect(metadata.cacheVary).toEqual([
    { scheme: 'env', name: 'EXPO_PUBLIC_A' },
    { scheme: 'env', name: 'EXPO_PUBLIC_B' },
  ]);
});

it(`records a cacheVary dim for inlined env vars that are unset`, () => {
  delete process.env.EXPO_PUBLIC_UNSET;

  const metadata = transformGetMetadata(`console.log(process.env.EXPO_PUBLIC_UNSET);`);

  expect(metadata.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_UNSET' }]);
});

it(`dedupes cacheVary dims for repeated usage in one file`, () => {
  process.env.EXPO_PUBLIC_A = 'a';

  const metadata = transformGetMetadata(`
console.log(process.env.EXPO_PUBLIC_A);
console.log(process.env.EXPO_PUBLIC_A);
process.env['EXPO_PUBLIC_A'];
`);

  expect(metadata.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_A' }]);
});

it(`records no cacheVary dims in development`, () => {
  process.env.EXPO_PUBLIC_A = 'a';

  const metadata = transformGetMetadata(`console.log(process.env.EXPO_PUBLIC_A);`, {
    caller: getCaller({ ...ENABLED_CALLER, platform: 'ios', isDev: true }),
  });

  expect(metadata.cacheVary).toBeUndefined();
});

it(`records no cacheVary dims for files that inline no env vars`, () => {
  process.env.EXPO_PUBLIC_A = 'a';

  const metadata = transformGetMetadata(`console.log(process.env.NODE_ENV);`);

  expect(metadata.cacheVary).toBeUndefined();
});

it(`keeps cacheVary dims per-file when the plugin instance is shared across files`, () => {
  process.env.EXPO_PUBLIC_A = 'a';
  process.env.EXPO_PUBLIC_B = 'b';

  // Share one preset config item so babel reuses cached plugin instances across transforms,
  // matching how Metro workers transform many files through the same babel config.
  const presetItem = babel.createConfigItem(preset, { type: 'preset' });
  const options = { presets: [presetItem] };

  const first = transformGetMetadata(`console.log(process.env.EXPO_PUBLIC_A);`, {
    ...options,
    filename: '/a.js',
  });
  const second = transformGetMetadata(`console.log(process.env.EXPO_PUBLIC_B);`, {
    ...options,
    filename: '/b.js',
  });

  // Harness sanity check: `publicEnvVars` is a known per-instance closure accumulator — if it
  // does NOT leak across the two files, the plugin instance was not shared and this test would
  // pass trivially against a closure-based cacheVary implementation.
  expect(second.publicEnvVars).toEqual(expect.arrayContaining(['EXPO_PUBLIC_A', 'EXPO_PUBLIC_B']));

  expect(first.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_A' }]);
  expect(second.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_B' }]);
});

describe('define-plugin inlines (EXPO_PUBLIC_USE_RN_FETCH in node_modules)', () => {
  const NODE_MODULE_CALLER = getCaller({
    name: 'metro',
    engine: 'hermes',
    platform: 'ios',
    isDev: false,
    isNodeModule: true,
  });

  it(`records a cacheVary dim only for files where the var was actually replaced`, () => {
    process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';

    const using = transformGetMetadata(
      `const useRnFetch = process.env.EXPO_PUBLIC_USE_RN_FETCH === '1';`,
      { caller: NODE_MODULE_CALLER }
    );
    const notUsing = transformGetMetadata(`console.log(process.env.NODE_ENV);`, {
      caller: NODE_MODULE_CALLER,
    });

    expect(using.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_USE_RN_FETCH' }]);
    expect(notUsing.cacheVary).toBeUndefined();
  });

  it(`records the cacheVary dim when the flag is unset (dims are a pure function of the source)`, () => {
    delete process.env.EXPO_PUBLIC_USE_RN_FETCH;

    const metadata = transformGetMetadata(
      `const useRnFetch = process.env.EXPO_PUBLIC_USE_RN_FETCH === '1';`,
      // Use a different platform than the set-flag test above: babel caches the preset
      // evaluation per caller, and the preset reads the env var at preset-init.
      { caller: getCaller({ ...(NODE_MODULE_CALLER as any), platform: 'android' }) }
    );

    expect(metadata.cacheVary).toEqual([{ scheme: 'env', name: 'EXPO_PUBLIC_USE_RN_FETCH' }]);
  });
});
