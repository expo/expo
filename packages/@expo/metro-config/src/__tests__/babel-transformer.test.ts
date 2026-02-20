import generate from '@babel/generator';
import type { BabelTransformer } from '@expo/metro/metro-babel-transformer';
import { vol } from 'memfs';

import * as babel from '../babel-core';
// eslint-disable-next-line import/namespace
import * as untypedTransformer from '../babel-transformer';

const transformer = untypedTransformer as BabelTransformer;

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
    caller: {
      // HERE IS THE MAGIC
      isReactServer: false,
      isServer: true,
      isDev: true,
      bundler: 'metro',
      engine: undefined,
      isHermesV1: true,
      name: 'metro',
      platform: 'ios',
      baseUrl: '',
      isNodeModule: false,
      isHMREnabled: true,
      preserveEnvVars: undefined,
      projectRoot: expect.any(String),
      routerRoot: 'app',
    },
    cloneInputAst: false,
    code: false,
    cwd: '/',
    extends: undefined,
    filename: 'foo.js',
    highlightCode: true,
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
      projectRoot: expect.any(String),
      routerRoot: 'app',
    }),
    cloneInputAst: false,
    code: false,
    cwd: '/',
    extends: undefined,
    filename: 'foo.js',
    highlightCode: true,
    presets: [expect.anything()],
    plugins: [],
    sourceType: 'unambiguous',
  });
});

describe('isHermesV1 detection', () => {
  const fixture = `export default function App() { return <div>Hello</div> }`;

  const transformOptions = {
    globalPrefix: '',
    enableBabelRuntime: true,
    enableBabelRCLookup: true,
    dev: true,
    projectRoot: '/',
    inlineRequires: false as any,
    minify: false,
    platform: 'ios' as const,
    publicPath: '/',
    customTransformOptions: Object.create({}),
  };

  function setupTransformerWithHermesVersion(version: string | null) {
    jest.resetModules();
    if (version !== null) {
      jest.doMock('hermes-compiler/package.json', () => ({ version }));
    }
    jest.doMock('../babel-core', () => {
      const actual = jest.requireActual('../babel-core');
      return {
        ...actual,
        transformSync: jest.fn((...args: any[]) => actual.transformSync(...args)),
      };
    });
    return {
      babel: require('../babel-core') as typeof babel,
      transformer: require('../babel-transformer') as BabelTransformer,
    };
  }

  it('sets isHermesV1 to true when hermes-compiler version starts with 250829098', () => {
    vol.fromJSON({}, '/');
    const { babel: localBabel, transformer: localTransformer } =
      setupTransformerWithHermesVersion('250829098.0.4');

    localTransformer.transform({
      filename: 'foo.js',
      options: transformOptions,
      src: fixture,
      plugins: [],
    });

    expect(localBabel.transformSync).toHaveBeenCalledWith(
      fixture,
      expect.objectContaining({
        caller: expect.objectContaining({ isHermesV1: true }),
      })
    );
  });

  it('sets isHermesV1 to false when hermes-compiler version is non-V1', () => {
    vol.fromJSON({}, '/');
    const { babel: localBabel, transformer: localTransformer } =
      setupTransformerWithHermesVersion('0.15.0');

    localTransformer.transform({
      filename: 'foo.js',
      options: transformOptions,
      src: fixture,
      plugins: [],
    });

    expect(localBabel.transformSync).toHaveBeenCalledWith(
      fixture,
      expect.objectContaining({
        caller: expect.objectContaining({ isHermesV1: false }),
      })
    );
  });

  it('sets isHermesV1 to false when hermes-compiler is not installed', () => {
    vol.fromJSON({}, '/');
    const { babel: localBabel, transformer: localTransformer } =
      setupTransformerWithHermesVersion(null);

    localTransformer.transform({
      filename: 'foo.js',
      options: transformOptions,
      src: fixture,
      plugins: [],
    });

    expect(localBabel.transformSync).toHaveBeenCalledWith(
      fixture,
      expect.objectContaining({
        caller: expect.objectContaining({ isHermesV1: false }),
      })
    );
  });
});
