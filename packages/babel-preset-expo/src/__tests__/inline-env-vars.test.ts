import * as babel from '@babel/core';

import preset from '..';
import { getInlineEnvVarsEnabled } from '../common';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
};

describe(getInlineEnvVarsEnabled, () => {
  it(`enables under the correct conditions`, () => {
    process.env.NODE_ENV = 'test';
    process.env.BABEL_ENV = 'test';
    // Defaults to on.
    expect(getInlineEnvVarsEnabled({})).toBe(true);

    expect(getInlineEnvVarsEnabled(ENABLED_CALLER)).toBe(true);

    expect(getInlineEnvVarsEnabled({ ...ENABLED_CALLER, isServer: undefined })).toBe(true);
    expect(
      getInlineEnvVarsEnabled({
        ...ENABLED_CALLER,
        platform: 'ios',
      })
    ).toBe(true);
  });
  it(`aggressively disables`, () => {
    expect(getInlineEnvVarsEnabled({ preserveEnvVars: true })).toBe(false);

    // Webpack
    expect(
      getInlineEnvVarsEnabled({
        ...ENABLED_CALLER,
        name: 'babel-loader',
      })
    ).toBe(false);
    expect(
      getInlineEnvVarsEnabled({
        ...ENABLED_CALLER,
        preserveEnvVars: true,
      })
    ).toBe(false);
    expect(
      getInlineEnvVarsEnabled({
        ...ENABLED_CALLER,
        isServer: true,
      })
    ).toBe(false);
    expect(
      getInlineEnvVarsEnabled({
        ...ENABLED_CALLER,
        isDev: true,
      })
    ).toBe(false);
  });
});

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
  retainLines: true,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

it(`inlines environment variables`, () => {
  process.env.EXPO_PUBLIC_NODE_ENV = 'development';
  process.env.EXPO_PUBLIC_FOO = 'bar';

  const options = {
    ...DEF_OPTIONS,
  };

  const sourceCode = `
const foo = process.env.JEST_WORKER_ID;
process.env.ABC;
console.log(process.env.NODE_ENV);
console.log(process.env.EXPO_PUBLIC_NODE_ENV);
process.env.EXPO_PUBLIC_FOO;

env.EXPO_PUBLIC_URL;

process.env['other'];
`;

  const contents = babel.transform(sourceCode, options)!.code;

  expect(contents).toMatch('development');
  expect(contents).toMatch('bar');
  expect(contents).not.toMatch('process.env.NODE_ENV');
  expect(contents).toMatch('process.env.JEST_WORKER_ID');
  expect(contents).not.toMatch('EXPO_PUBLIC_NODE_ENV');
  expect(contents).not.toMatch('EXPO_PUBLIC_FOO');
  expect(contents).toMatchSnapshot();
});

it(`does not inline environment variables`, () => {
  process.env.EXPO_PUBLIC_NODE_ENV = 'development';
  process.env.EXPO_PUBLIC_FOO = 'bar';

  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  const sourceCode = `
const foo = process.env.JEST_WORKER_ID;
process.env.ABC;
console.log(process.env.NODE_ENV);
console.log(process.env.EXPO_PUBLIC_NODE_ENV);
process.env.EXPO_PUBLIC_FOO;

env.EXPO_PUBLIC_URL;

process.env['other'];
`;

  const contents = babel.transform(sourceCode, options)!.code;

  expect(contents).not.toMatch('development');
  expect(contents).not.toMatch('bar');
  expect(contents).toMatch('process.env.NODE_ENV');
  expect(contents).toMatch('process.env.JEST_WORKER_ID');
  expect(contents).toMatch('EXPO_PUBLIC_NODE_ENV');
  expect(contents).toMatch('EXPO_PUBLIC_FOO');
  expect(contents).toMatchSnapshot();
});

it(`does not inline environment variables inside of node modules`, () => {
  process.env.EXPO_PUBLIC_NODE_ENV = 'development';

  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: true,
      isNodeModule: true,
    }),
  };

  const sourceCode = `
console.log(process.env.EXPO_PUBLIC_NODE_ENV);
`;

  const contents = babel.transform(sourceCode, options)!.code;

  expect(contents).toMatch('EXPO_PUBLIC_NODE_ENV');
});
