/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  projectRoot: '/',
  supportsStaticESM: true,
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',

  babelrc: false,
  presets: [preset],

  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

function transformTest(sourceCode: string) {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller(ENABLED_CALLER),
  };

  const results = babel.transform(sourceCode, options);
  if (!results) throw new Error('Failed to transform code');
  //   console.log('results', results.code);
  const meta = results.metadata as unknown as { hasCjsExports?: boolean };
  return {
    code: results.code,
    hasCjsExports: meta.hasCjsExports,
    metadata: meta,
  };
}

function expectCjsExports(sourceCode: string) {
  return expect(transformTest(sourceCode).hasCjsExports);
}

describe('esm', () => {
  [
    `export const foo = true`,
    `export function foo() {}`,
    `export default function foo() {}`,
    `Object.assign();`,
    `Object.assign(module.exports);`,
  ].forEach((sourceCode) => {
    it(sourceCode, () => {
      expectCjsExports(sourceCode).toBe(false);
    });
  });
});
describe('cjs', () => {
  [
    `module.exports = { foo: 'bar' };`,
    `module.exports.foo = 'bar';`,
    `exports = { foo: 'bar' };`,
    `exports.foo = 'bar';`,
    `exports['foo'] = 'bar';`,
    `module['exports']['foo'] = 'bar';`,
    `{module['exports']['foo'] = 'bar';}`,
    `Object.assign(module.exports, { foo: 'bar' });`,
    `Object.assign(module['exports'], { foo: 'bar' });`,
    `Object.assign(exports, { foo: 'bar' });`,

    // Mixing
    `export const foo = true;exports.foo = 'bar';`,
    `exports.foo = 'bar';module.exports.foo = 'bar';`,
  ].forEach((sourceCode) => {
    it(sourceCode, () => {
      expectCjsExports(sourceCode).toBe(true);
    });
  });
});

xdescribe('todo', () => {
  // This should be detected.
  [`Object.assign(module['expo' + 'rts'], { foo: 'bar' });`].forEach((sourceCode) => {
    it(sourceCode, () => {
      expectCjsExports(sourceCode).toBe(true);
    });
  });

  // This shouldn't be detected since they re-define the exports objects.
  [
    `const module = {}; module.exports.foo = 'bar';`,
    `const exports = {}; exports.foo = 'bar';`,
  ].forEach((sourceCode) => {
    it(sourceCode, () => {
      expectCjsExports(sourceCode).toBe(false);
    });
  });
});
