import * as babel from '@babel/core';

import preset from '../..';
import { getInlineEnvVarsEnabled } from '../../common';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  isHMREnabled: true,
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
process.env['EXPO_PUBLIC_FOO'];
process.env?.EXPO_PUBLIC_FOO;
process.env?.['EXPO_PUBLIC_FOO'];

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

it(`inlines environment variables in development`, () => {
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
process.env['EXPO_PUBLIC_FOO'];
process.env?.EXPO_PUBLIC_FOO;
process.env?.['EXPO_PUBLIC_FOO'];

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

// `expo/.../winter/runtime.native.ts` reads `EXPO_PUBLIC_USE_RN_FETCH` to opt out of `expo/fetch`,
// but it ships inside `node_modules` where general `EXPO_PUBLIC_*` inlining is disabled. The define
// plugin still inlines this specific var so the documented opt-out works in production builds.
it(`inlines EXPO_PUBLIC_USE_RN_FETCH inside node modules so the expo/fetch opt-out works in production`, () => {
  process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';

  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
      isNodeModule: true,
    }),
  };

  const sourceCode = `
const useRnFetch =
  process.env.EXPO_PUBLIC_USE_RN_FETCH === '1' || process.env.EXPO_PUBLIC_USE_RN_FETCH === 'true';
`;

  const normalized = babel.transform(sourceCode, options)!.code!.replace(/\s+/g, ' ');

  // The lookup is inlined (and folded) so the opt-out resolves at build time.
  expect(normalized).not.toMatch('process.env.EXPO_PUBLIC_USE_RN_FETCH');
  expect(normalized).toContain('var useRnFetch = true || false;');
});

it(`leaves EXPO_PUBLIC_USE_RN_FETCH untouched inside node modules when the flag is unset`, () => {
  delete process.env.EXPO_PUBLIC_USE_RN_FETCH;

  const options = {
    ...DEF_OPTIONS,
    // Use a distinct platform so Babel doesn't reuse the cached preset config from the test above
    // (the inline value is read from `process.env`, which Babel's caller-keyed cache doesn't track).
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'android',
      isDev: false,
      isNodeModule: true,
    }),
  };

  const sourceCode = `
const useRnFetch =
  process.env.EXPO_PUBLIC_USE_RN_FETCH === '1' || process.env.EXPO_PUBLIC_USE_RN_FETCH === 'true';
`;

  const contents = babel.transform(sourceCode, options)!.code;

  expect(contents).toMatch('process.env.EXPO_PUBLIC_USE_RN_FETCH');
});

function transformTest(
  sourceCode: string,
  customOptions: { filename?: string; caller?: any } = {}
) {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller(ENABLED_CALLER),
    ...customOptions,
  };

  const results = babel.transform(sourceCode, options);
  if (!results) throw new Error('Failed to transform code');
  const meta = results.metadata as unknown as { hasCjsExports?: boolean };

  // Parse again to ensure the output is valid code
  babel.parse(results.code, options);

  return {
    code: results.code,
    hasCjsExports: meta.hasCjsExports,
    metadata: meta,
  };
}

it(`inlines environment variables in development`, () => {
  process.env.EXPO_PUBLIC_NODE_ENV = 'development';
  process.env.EXPO_PUBLIC_FOO = 'bar';

  const sourceCode = `
const foo = process.env.EXPO_PUBLIC_URL;

function App() {
  console.log(process.env.EXPO_PUBLIC_NODE_ENV);
}
`;

  const contents = transformTest(sourceCode, {
    caller: getCaller({
      ...ENABLED_CALLER,
      isDev: true,
    }),
  });

  expect(contents.code).toMatch('expo/virtual/env');
  expect(contents.metadata).toEqual({ publicEnvVars: ['EXPO_PUBLIC_URL', 'EXPO_PUBLIC_NODE_ENV'] });

  expect(contents).toMatchSnapshot();
});
