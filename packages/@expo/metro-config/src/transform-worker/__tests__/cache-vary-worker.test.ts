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

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();

  Transformer = require('../metro-transform-worker');

  process.env = { ...originalEnv };

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
