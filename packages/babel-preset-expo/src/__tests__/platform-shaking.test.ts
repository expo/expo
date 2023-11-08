import * as babel from '@babel/core';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEFAULT_OPTS = {
  babelrc: false,
  presets: [[preset]],
  plugins: [
    // Fold constants to emulate Metro
    require('metro-transform-plugins/src/constant-folding-plugin.js'),
  ],
  sourceMaps: true,
  filename: 'unknown',
  configFile: false,
  compact: true,
  comments: false,
  retainLines: false,
};

function stripReactNativeImport(code: string) {
  return code
    .replace(
      'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _Platform=_interopRequireDefault(require("react-native-web/dist/exports/Platform"));',
      ''
    )
    .replace('var _reactNative=require("react-native");', '');
}

it(`removes Platform module usage on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('web');});`
  );
});

it(`removes Platform module usage on native`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'android', isDev: false }),
  };

  expect(
    babel.transform(
      `Platform.select({ ios: () => console.log('ios'), web: () => console.log('web'), android: () => console.log('android'), })`,
      options
    )!.code
  ).toEqual(`(function(){return console.log('android');});`);

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('android');});`
  );
});

it(`removes __DEV__ usage`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'android', isDev: false }),
  };

  const sourceCode = `  
    if (__DEV__) {
      require('./foobar')
    }
    `;

  expect(babel.transform(sourceCode, options)!.code!).toEqual(``);
});
