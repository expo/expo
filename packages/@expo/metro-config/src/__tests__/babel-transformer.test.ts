import generate from '@babel/generator';
import { vol } from 'memfs';
import type { BabelTransformer } from 'metro-babel-transformer';

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
      hot: true,
      inlineRequires: false,
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

  expect(babel.transformSync).toBeCalledWith(fixture, {
    ast: true,
    babelrc: true,
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
      hot: true,
      inlineRequires: false,
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

  expect(console.warn).toBeCalledTimes(0);
  expect(generate(results.ast).code).toMatchSnapshot();

  expect(babel.transformSync).toBeCalledWith(fixture, {
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
