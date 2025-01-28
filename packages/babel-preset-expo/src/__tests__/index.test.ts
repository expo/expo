import * as babel from '@babel/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

jest.mock('../common.ts', () => ({
  ...jest.requireActual('../common.ts'),
  hasModule: jest.fn((moduleId) => {
    if (['react-native-reanimated', 'expo-router', '@expo/vector-icons'].includes(moduleId)) {
      return true;
    }
    return false;
  }),
}));

describe('flow + esm', () => {
  const BABEL_OPTIONS = {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
    filename: '/unknown',
    configFile: false,
    compact: false,
    comments: true,
    retainLines: false,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      supportsStaticESM: true,
    }),
  };

  it(`strips flow code with supportsStaticESM enabled`, () => {
    // All of this code should remain intact.
    const sourceCode = `
  /**
   * @flow
   */
  import foo from 'bar';
  import typeof ActionSheetIOS from './Libraries/ActionSheetIOS/ActionSheetIOS';
  export type HostComponent<T> = _HostComponentInternal<T>;
  
  const foox: CustomFlowType = 'foo';
  
  const other = {
    get registerCallableModule(): CustomFlowType {
      return require('./Libraries/Core/registerCallableModule').default;
    }, 
  };
  
  module.exports = (ReactFabric: CustomFlowType);
  
  module.exports = {
    get xyz(): CustomFlowType {
      return require('./other');
    }, 
  };
  `;
    const results = babel.transform(sourceCode, BABEL_OPTIONS)!;
    expect(results.code).toMatch('import foo');
    expect(results.code).not.toMatch('CustomFlowType');
  });
});

it(`compiles samples with Metro targeting Hermes`, () => {
  const options = {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
    filename: '/unknown',
    configFile: false,
    compact: false,
    comments: true,
    retainLines: true,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios' }),
  };

  // All of this code should remain intact.
  const sourceCode = `
var obj = {
  ["x" + foo]: "heh",
  ["y" + bar]: "noo",
  foo: "foo",
  bar: "bar"
};

var a1 = 0;
var c = { a1 };

try {
  throw 0;
} catch {
}

var d = 0b11;
var e = 0o7;
var f = "Hello\\u{000A}\\u{0009}!";

var budget = 1_000_000_000_000;
var nibbles = 0b1010_0001_1000_0101;
var message = 0xa0_b0_c0;

var g = /o+/y;

var h = ["a", "b", "c"];

var i = [...h, "foo"];

var j = foo(...h);

var y = {};
var x = 1;
var k = { x, ...y };


var m = {}?.x;

var obj2 = {};
var foo = obj2.foo ?? "default";`;
  const withHermes = babel.transform(sourceCode, options)!;

  expect(withHermes.code).toEqual(sourceCode);
});

it(`compiles sample file with Metro targeting Hermes`, () => {
  const options = {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
    caller: getCaller({ name: 'metro', engine: 'hermes' }),
  };
  const fileName = path.resolve(__dirname, 'samples/App.js');

  const withHermes = babel.transformFileSync(fileName, options)!;
  const withoutHermes = babel.transformFileSync(fileName, {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
    caller: getCaller({ name: 'metro' }),
  })!;

  expect(withHermes.code).not.toEqual(withoutHermes.code);

  // 😎
  expect(withHermes.code!.length).toBeLessThan(withoutHermes.code!.length);
});

it(`supports overwriting the default engine option`, () => {
  const fileName = path.resolve(__dirname, 'samples/App.js');

  const firstPass = babel.transformFileSync(fileName, {
    babelrc: false,
    presets: [
      [
        preset,
        {
          native: {
            // This should overwrite the default engine option which is passed to Babel via Expo CLI.
            unstable_transformProfile: 'default',
          },
        },
      ],
    ],
    sourceMaps: true,
    caller: getCaller({ name: 'metro', platform: 'ios', engine: 'hermes' }),
  })!;

  const secondPass = babel.transformFileSync(fileName, {
    babelrc: false,
    presets: [[preset, {}]],
    sourceMaps: true,
    caller: getCaller({ name: 'metro', platform: 'ios', engine: 'hermes' }),
  })!;

  expect(firstPass.code).not.toEqual(secondPass.code);
});

describe.each([
  ['metro', getCaller({ name: 'metro', isDev: false })],
  ['metro+hermes', getCaller({ name: 'metro', engine: 'hermes', isDev: true })],
  ['webpack', getCaller({ name: 'babel-loader', isDev: true })],
])('%s', (_name, caller) => {
  it(`compiles sample files`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      sourceMaps: true,
      caller,
    };
    const samplesPath = path.resolve(__dirname, 'samples');
    const filenames = fs.readdirSync(samplesPath);

    for (const filename of filenames) {
      const { code, map, ast } = babel.transformFileSync(
        path.join(samplesPath, filename),
        options
      )!;

      expect(code).toBeDefined();
      expect(map).toBeDefined();
      expect(ast).toBeDefined();
    }
  });

  it(`uses the platform's react-native import`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: '/unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
import { View } from 'react-native';
`;
    const { code } = babel.transform(sourceCode, options)!;

    expect(code).toMatchSnapshot();
  });

  it(`transpiles non-standard exports`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: '/unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
export * as default from './Animated';
`;
    const { code } = babel.transform(sourceCode, options)!;

    expect(code).toMatchSnapshot();
  });

  it(`supports disabling reanimated`, () => {
    expect(require.resolve('react-native-reanimated/plugin')).toBeDefined();

    const samplesPath = path.resolve(__dirname, 'samples/worklet.js');

    const options = {
      babelrc: false,
      presets: [[preset, { reanimated: false, jsxRuntime: 'automatic' }]],
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const code = babel.transformFileSync(samplesPath, options)!.code;
    expect(code).toContain("'worklet';");
    expect(code).toMatchSnapshot();
  });

  it(`supports reanimated worklets`, () => {
    expect(require.resolve('react-native-reanimated/plugin')).toBeDefined();

    const samplesPath = path.resolve(__dirname, 'samples/worklet.js');

    const options = {
      babelrc: false,
      presets: [[preset, { jsxRuntime: 'automatic' }]],
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    function stablePaths(src) {
      return src
        .replace(new RegExp(samplesPath, 'g'), '[mock]/worklet.js')
        .replace(/version:".*"/, 'version:"[GLOBAL]"');
    }

    const code = stablePaths(babel.transformFileSync(samplesPath, options)!.code);

    expect(code).toMatchSnapshot();

    expect(
      stablePaths(
        babel.transformFileSync(samplesPath, {
          ...options,
          // Test that duplicate plugins make no difference
          plugins: [require.resolve('react-native-reanimated/plugin')],
        })!.code
      )
    ).toBe(code);
  });

  it(`does not alias @expo/vector-icons in the transformer`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
import 'react-native-vector-icons';
require('react-native-vector-icons');
imposter.require('react-native-vector-icons');
imposter.import('react-native-vector-icons');
`;
    const { code } = babel.transform(sourceCode, options)!;

    expect(code).not.toMatch(/"@expo\/vector-icons"/);
  });

  it(`composes with babel-plugin-module-resolver`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      plugins: [
        [
          'module-resolver',
          {
            alias: { rn: 'react-native' },
          },
        ],
      ],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
import 'rn';
import 'react-native-vector-icons';
`;
    const { code } = babel.transform(sourceCode, options)!;

    expect(code).toMatch(/"react-native"/);
    // This is aliased later in the resolver for faster lookups and better caching.
    expect(code).toMatch(/react-native-vector-icons/);
    expect(code).toMatchSnapshot();
  });
});

describe('"lazyImports" option', () => {
  it(`defaults to null`, () => {
    const testFilename = path.resolve(__dirname, 'samples', 'Lazy.js');
    const optionsDefault = {
      babelrc: false,
      presets: [preset],
    };
    const { code: codeDefault } = babel.transformFileSync(testFilename, optionsDefault)!;

    const optionsNull = {
      babelrc: false,
      presets: [[preset, { lazyImports: null }]],
    };
    const { code: codeNull } = babel.transformFileSync(testFilename, optionsNull)!;

    expect(codeDefault).toEqual(codeNull);
  });

  it.each([
    [null],
    [false],
    [true],
    [['inline-comp', './inline-func', '../inline-func-with-side-effects.fx.ts']],
    [(name) => !(name.endsWith('.fx') || name.endsWith('.fx.js') || name.endsWith('.fx.ts'))],
  ])(`accepts %p`, (lazyImportsOption) => {
    const testFilename = path.resolve(__dirname, 'samples', 'Lazy.js');
    const options = {
      babelrc: false,
      presets: [[preset, { lazyImports: lazyImportsOption }]],
      // Make the snapshot easier to read
      retainLines: true,
    };

    const { code } = babel.transformFileSync(testFilename, options)!;
    expect(code).toMatchSnapshot();
  });
});
