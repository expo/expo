import type {
  JsTransformerConfig,
  JsTransformOptions,
  MinifierOptions,
} from '@expo/metro/metro-transform-worker';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import type { ExpoJsOutput } from '../../serializer/jsOutput';

jest
  .mock(
    '@expo/metro/metro-transform-worker/utils/getMinifier',
    () =>
      () =>
      ({ code, map }: MinifierOptions) => ({ code, map })
  )
  .mock('@expo/metro/metro-transform-plugins', () => ({
    ...jest.requireActual('@expo/metro/metro-transform-plugins'),
    inlinePlugin: () => ({}),
    constantFoldingPlugin: () => ({}),
  }))
  .mock('metro-minify-terser');

const babelTransformerPath = require.resolve('@expo/metro-config/babel-transformer');
const transformerContents = jest.requireActual('fs').readFileSync(babelTransformerPath);

let Transformer: typeof import('../metro-transform-worker');

const baseConfig: JsTransformerConfig = {
  allowOptionalDependencies: false,
  assetPlugins: [],
  assetRegistryPath: '',
  asyncRequireModulePath: 'asyncRequire',
  babelTransformerPath,
  dynamicDepsInPackages: 'reject',
  enableBabelRCLookup: false,
  enableBabelRuntime: true,
  globalPrefix: '',
  hermesParser: false,
  minifierConfig: { output: { comments: false } },
  minifierPath: 'minifyModulePath',
  optimizationSizeLimit: 100000,
  publicPath: '/assets',
  unstable_dependencyMapReservedName: null,
  unstable_compactOutput: false,
  unstable_disableModuleWrapping: false,
  unstable_disableNormalizePseudoGlobals: false,
  unstable_allowRequireContext: false,
};

const baseTransformOptions: JsTransformOptions = {
  dev: true,
  inlinePlatform: false,
  inlineRequires: false,
  minify: false,
  platform: 'ios',
  type: 'module',
  unstable_transformProfile: 'default',
  customTransformOptions: {
    __proto__: null,
  },
};

jest.mock('fs');

let mockExpoConfig: Record<string, unknown> = {};
jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(() => ({ exp: mockExpoConfig, pkg: {} })),
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();

  Transformer = require('../metro-transform-worker');

  process.env = { ...originalEnv };
  delete process.env.APP_MANIFEST;
  mockExpoConfig = { name: 'app', slug: 'app', extra: { API_BASE_URL: 'http://localhost:3000' } };

  vol.reset();
  fs.mkdirSync('/root/local', { recursive: true });
  fs.mkdirSync(path.dirname(babelTransformerPath), { recursive: true });
  fs.writeFileSync(babelTransformerPath, transformerContents);
});

afterAll(() => {
  process.env = { ...originalEnv };
});

const sha1 = (value: string) => crypto.createHash('sha1').update(value).digest('hex');

it('embeds current fingerprints for env vars inlined in production', async () => {
  process.env.EXPO_PUBLIC_TEST = 'test-value';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('console.log(process.env.EXPO_PUBLIC_TEST);', 'utf8'),
    { ...baseTransformOptions, dev: false }
  );

  const output = result.output[0] as ExpoJsOutput;
  expect(output.data.expoCacheVary).toEqual([
    {
      scheme: 'env',
      name: 'EXPO_PUBLIC_TEST',
      fp: sha1(JSON.stringify('test-value')),
    },
  ]);
  expect(typeof output.data.expoCacheVary![0]!.fp).toBe('string');
});

it('embeds current fingerprints with the noxcturnal transform worker', async () => {
  process.env.EXPO_PUBLIC_TEST = 'native-test-value';

  const result = await Transformer.transform(
    { ...baseConfig, unstable_noxcturnalTransformWorker: true } as JsTransformerConfig & {
      unstable_noxcturnalTransformWorker: boolean;
    },
    '/root',
    'local/file.js',
    Buffer.from('console.log(process.env.EXPO_PUBLIC_TEST);', 'utf8'),
    { ...baseTransformOptions, dev: false }
  );

  const output = result.output[0] as ExpoJsOutput;
  expect(output.data.expoCacheVary).toEqual([
    {
      scheme: 'env',
      name: 'EXPO_PUBLIC_TEST',
      fp: sha1(JSON.stringify('native-test-value')),
    },
  ]);
});

it('embeds current fingerprints for noxcturnal defines in node_modules', async () => {
  process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';

  const result = await Transformer.transform(
    { ...baseConfig, unstable_noxcturnalTransformWorker: true } as JsTransformerConfig & {
      unstable_noxcturnalTransformWorker: boolean;
    },
    '/root',
    'node_modules/example/index.js',
    Buffer.from('console.log(process.env.EXPO_PUBLIC_USE_RN_FETCH);', 'utf8'),
    { ...baseTransformOptions, dev: false }
  );

  const output = result.output[0] as ExpoJsOutput;
  expect(output.data.expoCacheVary).toEqual([
    {
      scheme: 'env',
      name: 'EXPO_PUBLIC_USE_RN_FETCH',
      fp: sha1(JSON.stringify('1')),
    },
  ]);
});

it('embeds no expoCacheVary in development', async () => {
  process.env.EXPO_PUBLIC_TEST = 'test-value';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('console.log(process.env.EXPO_PUBLIC_TEST);', 'utf8'),
    baseTransformOptions
  );

  const output = result.output[0] as ExpoJsOutput;
  expect(output.data.expoCacheVary).toBeUndefined();
});

it('embeds no expoCacheVary for files without env usage', async () => {
  process.env.EXPO_PUBLIC_TEST = 'test-value';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('console.log("hello");', 'utf8'),
    { ...baseTransformOptions, dev: false }
  );

  const output = result.output[0] as ExpoJsOutput;
  expect(output.data.expoCacheVary).toBeUndefined();
});

describe.each([
  ['babel', baseConfig],
  ['noxcturnal', { ...baseConfig, unstable_noxcturnalTransformWorker: true }],
] as const)('inlined Expo manifest with the %s transform worker', (_name, config) => {
  const manifestSource = Buffer.from('export default process.env.APP_MANIFEST;', 'utf8');
  const webOptions: JsTransformOptions = { ...baseTransformOptions, dev: false, platform: 'web' };

  function createMemoryStore() {
    const entries = new Map<string, unknown>();
    return {
      get: async (key: Buffer) => entries.get(key.toString('hex')) ?? null,
      set: async (key: Buffer, value: unknown) => {
        entries.set(key.toString('hex'), value);
      },
      clear: () => entries.clear(),
    };
  }

  it('records the Expo config and APP_MANIFEST as cache-vary dimensions', async () => {
    const result = await Transformer.transform(
      config as JsTransformerConfig,
      '/root',
      'local/constants.js',
      manifestSource,
      webOptions
    );

    const output = result.output[0] as ExpoJsOutput;
    expect(output.data.code).toContain('http://localhost:3000');
    expect(output.data.expoCacheVary).toEqual(
      expect.arrayContaining([
        { scheme: 'expo-config', name: 'exp', fp: expect.any(String) },
        { scheme: 'env', name: 'APP_MANIFEST', fp: sha1('') },
      ])
    );
  });

  it('does not serve a cached manifest after the Expo config changes', async () => {
    const inner = createMemoryStore();
    const key = Buffer.from('constants-cache-key');

    // First export: cache the transform for the initial config.
    const { VaryingCacheStore } = require('../../cache-vary/VaryingCacheStore');
    const firstStore = new VaryingCacheStore(inner, { projectRoot: '/root' });
    const first = await Transformer.transform(
      config as JsTransformerConfig,
      '/root',
      'local/constants.js',
      manifestSource,
      webOptions
    );
    expect(await firstStore.get(key)).toBeNull();
    await firstStore.set(key, first);

    // Second export in a new process: the dynamic config now resolves to a different value.
    jest.resetModules();
    mockExpoConfig = {
      ...mockExpoConfig,
      extra: { API_BASE_URL: 'https://api.development.example.com' },
    };
    const {
      VaryingCacheStore: NextVaryingCacheStore,
    } = require('../../cache-vary/VaryingCacheStore');
    const secondStore = new NextVaryingCacheStore(inner, { projectRoot: '/root' });
    expect(await secondStore.get(key)).toBeNull();

    // Restoring the initial config hits the original entry again.
    jest.resetModules();
    mockExpoConfig = {
      ...mockExpoConfig,
      extra: { API_BASE_URL: 'http://localhost:3000' },
    };
    const {
      VaryingCacheStore: RestoredVaryingCacheStore,
    } = require('../../cache-vary/VaryingCacheStore');
    const restoredStore = new RestoredVaryingCacheStore(inner, { projectRoot: '/root' });
    expect(await restoredStore.get(key)).toEqual(first);
  });
});
