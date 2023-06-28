const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const preset = require('..');
// Used to distinguish webpack from metro
const WEBPACK_CALLER = { name: 'babel-loader' };

describe.each([['metro'], ['webpack', WEBPACK_CALLER]])('%s', (_name, caller) => {
  const isMetro = _name === 'metro';
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
      const { code, map, ast } = babel.transformFileSync(path.join(samplesPath, filename), options);

      expect(code).toBeDefined();
      expect(map).toBeDefined();
      expect(ast).toBeDefined();
    }
  });

  it(`uses the platform's react-native import`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
import { View } from 'react-native';
`;
    const { code } = babel.transform(sourceCode, options);

    expect(code).toMatchSnapshot();
  });

  it(`transpiles non-standard exports`, () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    const sourceCode = `
export * as default from './Animated';
`;
    const { code } = babel.transform(sourceCode, options);

    expect(code).toMatchSnapshot();
  });

  it(`supports automatic JSX runtime`, () => {
    const options = {
      babelrc: false,
      presets: [[preset, { jsxRuntime: 'automatic' }]],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    // No React import...
    const sourceCode = `
import { Text, View } from 'react-native';
export default function App() {
  return (<View><Text>Hello World</Text></View>);
}`;
    const { code } = babel.transform(sourceCode, options);

    expect(code).toMatch(/"react\/jsx-runtime"/);

    expect(code).toMatch(isMetro ? /_jsxRuntime.jsx/ : /_jsx\(View/);
    expect(code).toMatchSnapshot();
  });

  it(`supports classic JSX runtime`, () => {
    const options = {
      babelrc: false,
      presets: [[preset, { jsxRuntime: 'classic' }]],
      filename: 'unknown',
      // Make the snapshot easier to read
      retainLines: true,
      caller,
    };

    // No React import...
    const sourceCode = `
import { Text, View } from 'react-native';
export default function App() {
  return (<View><Text>Hello World</Text></View>);
}`;
    const { code } = babel.transform(sourceCode, options);

    expect(code).not.toMatch(/"react\/jsx-runtime"/);

    expect(code).not.toMatch(isMetro ? /_jsxRuntime.jsx/ : /_jsx\(View/);
    expect(code).toMatchSnapshot();
  });

  it(`aliases @expo/vector-icons`, () => {
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
    const { code } = babel.transform(sourceCode, options);

    expect(code).toMatch(/"@expo\/vector-icons"/);
    expect(code).toMatchSnapshot();
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
    const { code } = babel.transform(sourceCode, options);

    expect(code).toMatch(/"react-native"/);
    expect(code).toMatch(/"@expo\/vector-icons"/);
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
    const { codeDefault } = babel.transformFileSync(testFilename, optionsDefault);

    const optionsNull = {
      babelrc: false,
      presets: [[preset, { lazyImports: null }]],
    };
    const { codeNull } = babel.transformFileSync(testFilename, optionsNull);

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

    const { code } = babel.transformFileSync(testFilename, options);
    expect(code).toMatchSnapshot();
  });
});
