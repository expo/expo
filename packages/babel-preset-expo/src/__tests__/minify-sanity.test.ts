// Run a number of basic operations on the minifier to ensure it works as expected
import * as babel from '@babel/core';

import preset from '..';
import { minifyLikeMetroAsync } from './minify-util';

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

it(`removes unused functions in development`, async () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'android',
      isDev: false,
    }),
  };

  const src = `
function foo() {}
function bar() { foo() }
`;
  expect((await minifyLikeMetroAsync(babel.transform(src, options)!)).code).toBe('');
});

it(`retains exported functions`, async () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'android',
      isDev: false,
      // Disable CJS
      supportsStaticESM: true,
    }),
  };

  const src = `  
export function foo() {}
`;
  expect((await minifyLikeMetroAsync(babel.transform(src, options)!)).code).toBe(
    'export function foo(){}'
  );
});

it(`does not remove top level variables due to module=false in the minifier (not passed from transformer)`, async () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'android',
      isDev: false,
    }),
  };

  const src = `  
const a = 0;
`;
  expect((await minifyLikeMetroAsync(babel.transform(src, options)!)).code).toBe('var a=0;');
});

it(`can remove unused functions based on platform-specific checks`, async () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'android',
      isDev: false,
      supportsStaticESM: true,
    }),
  };

  // noop should be removed when bundling for android
  const src = `  
function noop() {}
function android() {}

export const value = process.env.EXPO_OS === 'android' ? android : noop;
`;
  expect((await minifyLikeMetroAsync(babel.transform(src, options)!)).code).toBe(
    'function android(){}export var value=android;'
  );
});
