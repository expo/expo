const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const preset = require('..');

it(`compiles sample files`, () => {
  let options = {
    babelrc: false,
    presets: [preset],
    sourceMaps: true,
  };

  let samplesPath = path.resolve(__dirname, 'samples');
  let filenames = fs.readdirSync(samplesPath);

  for (let filename of filenames) {
    let { code, map, ast } = babel.transformFileSync(path.join(samplesPath, filename), options);

    expect(code).toBeDefined();
    expect(map).toBeDefined();
    expect(ast).toBeDefined();
  }
});

it(`aliases @expo/vector-icons`, () => {
  let options = {
    babelrc: false,
    presets: [preset],
    filename: 'unknown',
    // Make the snapshot easier to read
    retainLines: true,
  };

  let sourceCode = `
import 'react-native-vector-icons';
require('react-native-vector-icons');

imposter.require('react-native-vector-icons');
imposter.import('react-native-vector-icons');
`;
  let { code } = babel.transform(sourceCode, options);

  expect(code).toMatch(/"@expo\/vector-icons"/);
  expect(code).toMatchSnapshot();
});

it(`composes with babel-plugin-module-resolver`, () => {
  let options = {
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
  };

  let sourceCode = `
import 'rn';
import 'react-native-vector-icons';
`;
  let { code } = babel.transform(sourceCode, options);

  expect(code).toMatch(/"react-native"/);
  expect(code).toMatch(/"@expo\/vector-icons"/);
  expect(code).toMatchSnapshot();
});

it(`uses lazy - default (no option) matches option "null"`, () => {
  let testFilename = path.join(path.resolve(__dirname, 'samples'), 'Lazy.js');
  let optionsDefault = {
    babelrc: false,
    presets: [preset],
  };
  let { codeDefault } = babel.transformFileSync(testFilename, optionsDefault);

  let optionsNull = {
    babelrc: false,
    presets: [[preset, { lazy: null }]],
  };
  let { codeNull } = babel.transformFileSync(testFilename, optionsNull);

  expect(codeDefault).toEqual(codeNull);
});

it(`uses lazy - different values`, () => {
  let testFilename = path.join(path.resolve(__dirname, 'samples'), 'Lazy.js');
  let lazy_options = [
    null,
    false,
    true,
    ['inline-comp', './inline-func', '../inline-func-with-side-effects.fx.ts'],
    name => {
      if (name.endsWith('.fx') || name.endsWith('.fx.js') || name.endsWith('.fx.ts')) {
        return false;
      }
      return true;
    },
  ];

  for (let lazy_option of lazy_options) {
    let options = {
      babelrc: false,
      presets: [[preset, { lazy: lazy_option }]],
      // Make the snapshot easier to read
      retainLines: true,
    };

    let { code } = babel.transformFileSync(testFilename, options);
    expect(code).toMatchSnapshot();
  }
});
