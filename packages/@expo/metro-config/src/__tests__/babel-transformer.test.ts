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
    parseSync: jest.fn((...props) => babel.parseSync(...props)),
  };
});

afterEach(() => {
  vol.reset();
});

it(`passes the environment as isServer to the babel preset`, () => {
  vol.fromJSON({}, '/');

  const fixture = `import { Platform } from 'react-native';
    
    export default function App() {
        return <div>Hello</div>
    }`;

  const results = transformer.transform({
    filename: 'foo.js',
    options: {
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

  expect(generate(results.ast).code).toMatchInlineSnapshot(`
    "Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = App;
    var _reactNative = require("react-native");
    var _jsxDevRuntime = require("react/jsx-dev-runtime");
    var _jsxFileName = "/foo.js";
    function App() {
      return /*#__PURE__*/(0, _jsxDevRuntime.jsxDEV)("div", {
        children: "Hello"
      }, void 0, false, {
        fileName: _jsxFileName,
        lineNumber: 4,
        columnNumber: 16
      }, this);
    }
    _c = App;
    var _c;
    $RefreshReg$(_c, "App");"
  `);

  expect(babel.parseSync).toBeCalledWith(
    fixture,
    expect.objectContaining({
      ast: true,
      babelrc: true,
      caller: {
        // HERE IS THE MAGIC
        isServer: true,
        isDev: true,
        bundler: 'metro',
        name: 'metro',
        platform: 'ios',
        baseUrl: '',
        projectRoot: expect.any(String),
      },
      cloneInputAst: false,
      code: false,
      cwd: '/',
      extends: undefined,
      filename: 'foo.js',
      highlightCode: true,
      presets: [
        [
          expect.anything(),
          {
            native: {
              dev: true,
              enableBabelRuntime: true,
            },
            web: {
              dev: true,
              enableBabelRuntime: true,
            },
          },
        ],
      ],
      sourceType: 'unambiguous',
    })
  );
});
