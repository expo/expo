import generate from '@babel/generator';
import type { BabelTransformer, BabelTransformerArgs } from '@expo/metro/metro-babel-transformer';
import { vol } from 'memfs';

import * as babel from '../babel-core';
// eslint-disable-next-line import/namespace
import * as untypedTransformer from '../babel-transformer';
import type { ExpoBabelTransformer } from '../babel-transformer';

const transformer = untypedTransformer as ExpoBabelTransformer;

jest.mock('../babel-core', () => {
  const babel = jest.requireActual('../babel-core');
  return {
    ...babel,
    transformFromAstSync: jest.fn((...props) => babel.transformFromAstSync(...props)),
    transformSync: jest.fn((...props) => babel.transformSync(...props)),
  };
});
const originalWarn = console.warn;

afterEach(() => {
  vol.reset();
  console.warn = originalWarn;
});

it(`passes the environment as isServer to the babel preset`, () => {
  console.warn = jest.fn();
  vol.fromJSON({}, '/');

  const fixture = `import { Platform } from 'react-native';

    export default function App() {
        return <div>Hello</div>
    }`;

  const results = transformer.transform({
    filename: 'foo.js',
    options: {
      globalPrefix: '',
      enableBabelRuntime: true,
      enableBabelRCLookup: true,
      dev: true,
      projectRoot: '/',
      inlineRequires: false as any, // TODO(@kitten): Remove
      minify: false,
      platform: 'ios',
      publicPath: '/',
      customTransformOptions: Object.create({
        environment: 'node',
      }),
    },
    src: fixture,
    plugins: [],
  });

  expect(generate(results.ast).code).toMatchSnapshot();

  expect(babel.transformSync).toHaveBeenCalledWith(fixture, {
    ast: true,
    babelrc: true,
    babelrcRoots: '/',
    caller: {
      // HERE IS THE MAGIC
      isReactServer: false,
      isServer: true,
      isDev: true,
      bundler: 'metro',
      engine: undefined,
      name: 'metro',
      platform: 'ios',
      baseUrl: '',
      isNodeModule: false,
      isHMREnabled: true,
      preserveEnvVars: undefined,
      projectRoot: '/',
      routerRoot: 'app',
      supportsReactCompiler: undefined,
      supportsStaticESM: undefined,
    },
    cloneInputAst: false,
    code: false,
    configFile: true,
    cwd: '/',
    extends: undefined,
    filename: 'foo.js',
    highlightCode: true,
    root: '/',
    presets: [expect.anything()],
    plugins: [],
    sourceType: 'unambiguous',
  });
});

it(`passes the environment as isReactServer to the babel preset`, () => {
  console.warn = jest.fn();
  vol.fromJSON({}, '/');

  const fixture = `import { Platform } from 'react-native';

    export default function App() {
        return <div>Hello</div>
    }`;

  const results = transformer.transform({
    filename: 'foo.js',
    options: {
      globalPrefix: '',
      enableBabelRuntime: true,
      enableBabelRCLookup: true,
      dev: true,
      projectRoot: '/',
      inlineRequires: false as any, // TODO(@kitten): Remove
      minify: false,
      platform: 'ios',
      publicPath: '/',
      customTransformOptions: Object.create({
        environment: 'react-server',
      }),
    },
    src: fixture,
    plugins: [],
  });

  expect(console.warn).toHaveBeenCalledTimes(0);
  expect(generate(results.ast).code).toMatchSnapshot();

  expect(babel.transformSync).toHaveBeenCalledWith(fixture, {
    ast: true,
    babelrc: true,
    babelrcRoots: '/',
    caller: expect.objectContaining({
      // HERE IS THE MAGIC
      isReactServer: true,
      isServer: true,
      isDev: true,
      bundler: 'metro',
      engine: undefined,
      name: 'metro',
      platform: 'ios',
      baseUrl: '',
      isNodeModule: false,
      isHMREnabled: true,
      preserveEnvVars: undefined,
      projectRoot: '/',
      routerRoot: 'app',
    }),
    cloneInputAst: false,
    code: false,
    configFile: true,
    cwd: '/',
    extends: undefined,
    filename: 'foo.js',
    highlightCode: true,
    root: '/',
    presets: [expect.anything()],
    plugins: [],
    sourceType: 'unambiguous',
  });
});

describe('getCacheKey', () => {
  let mockGetFileCacheKey: jest.Mock;

  function setupTransformerForCacheKey(
    mockFiles?: Set<string>,
    mockConfigName?: string | undefined
  ) {
    jest.resetModules();
    const mockLoadPartialConfigSync = jest.fn(() =>
      mockFiles != null ? { files: mockFiles } : null
    );
    mockGetFileCacheKey = jest.fn((files: string[]) => files.join(':'));
    jest.doMock('../babel-core', () => {
      const actual = jest.requireActual('../babel-core');
      return { ...actual, loadPartialConfigSync: mockLoadPartialConfigSync };
    });
    jest.doMock('@expo/metro/metro-cache-key', () => ({
      getCacheKey: mockGetFileCacheKey,
    }));
    if (mockConfigName !== undefined) {
      jest.doMock('../loadBabelConfig', () => ({
        ...jest.requireActual('../loadBabelConfig'),
        resolveBabelrcName: () => mockConfigName,
      }));
    }
    return {
      loadPartialConfigSync: mockLoadPartialConfigSync,
      transformer: require('../babel-transformer') as ExpoBabelTransformer,
    };
  }

  it('returns an empty string when no options are provided', () => {
    const { transformer: t } = setupTransformerForCacheKey();
    expect(t.getCacheKey!()).toBe('');
  });

  it('returns an empty string when enableBabelRCLookup is false', () => {
    const { transformer: t } = setupTransformerForCacheKey();
    expect(t.getCacheKey!({ projectRoot: '/', enableBabelRCLookup: false })).toBe('');
  });

  it('returns an empty string when no babel config exists', () => {
    const { transformer: t } = setupTransformerForCacheKey(undefined, undefined);
    expect(t.getCacheKey!({ projectRoot: '/' })).toBe('');
  });

  it('calls loadPartialConfigSync with resolved extends path', () => {
    const { loadPartialConfigSync, transformer: t } = setupTransformerForCacheKey(
      new Set(['/babel.config.js']),
      'babel.config.js'
    );
    const key = t.getCacheKey!({ projectRoot: '/' });
    expect(key).toBeTruthy();
    expect(loadPartialConfigSync).toHaveBeenCalledWith(
      expect.objectContaining({ extends: '/babel.config.js' })
    );
  });

  it('uses extendsBabelConfigPath over resolveBabelrcName', () => {
    const { loadPartialConfigSync, transformer: t } = setupTransformerForCacheKey(
      new Set(['/.babelrc']),
      'should-not-be-used.js'
    );
    t.getCacheKey!({ projectRoot: '/', extendsBabelConfigPath: '.babelrc' });
    expect(loadPartialConfigSync).toHaveBeenCalledWith(
      expect.objectContaining({ extends: '/.babelrc' })
    );
  });

  it('passes file paths from loadPartialConfigSync to getFileCacheKey', () => {
    const files = new Set(['/babel.config.js', '/.babelrc']);
    const { transformer: t } = setupTransformerForCacheKey(files, 'babel.config.js');
    t.getCacheKey!({ projectRoot: '/' });
    expect(mockGetFileCacheKey).toHaveBeenCalledWith(['/.babelrc', '/babel.config.js']);
  });
});

describe('isDefaultConfig', () => {
  const args: BabelTransformerArgs = {
    filename: '/app/node_modules/example/index.jsx',
    src: 'module.exports = <View />;',
    plugins: [],
    options: {
      dev: true,
      enableBabelRCLookup: true,
      enableBabelRuntime: '7.29.2',
      extendsBabelConfigPath: 'babel.config.js',
      globalPrefix: '',
      inlineRequires: false as any,
      minify: false,
      platform: 'ios',
      projectRoot: '/app',
      publicPath: '/',
      customTransformOptions: { engine: 'hermes' },
    },
  };

  function setupConfigComparison(equivalent: boolean) {
    jest.resetModules();
    const configuredPreset = {};
    const baselinePreset = equivalent ? configuredPreset : {};
    const loadPartialConfigSync = jest.fn((options: { extends?: string }) => ({
      files: new Set(['/app/babel.config.js']),
      options: {
        assumptions: {},
        plugins: [],
        presets: [
          {
            value: options.extends ? configuredPreset : baselinePreset,
            options: undefined,
          },
        ],
      },
    }));
    jest.doMock('../babel-core', () => ({
      ...jest.requireActual('../babel-core'),
      loadPartialConfigSync,
    }));
    const resolved = require('../babel-transformer') as BabelTransformer & {
      isDefaultConfig(args: BabelTransformerArgs): boolean;
    };
    return { resolved, loadPartialConfigSync };
  }

  it('accepts a resolved config equivalent to the default Expo preset', () => {
    const { resolved, loadPartialConfigSync } = setupConfigComparison(true);
    expect(resolved.isDefaultConfig(args)).toBe(true);
    expect(loadPartialConfigSync).toHaveBeenCalledTimes(2);
  });

  it('rejects a resolved config with a different preset descriptor', () => {
    const { resolved } = setupConfigComparison(false);
    expect(resolved.isDefaultConfig(args)).toBe(false);
  });
});
