import * as babel from '@babel/core';

import preset from '../..';
import {
  getInlineEnvVarsEnabled,
  getNodeModuleInlineEnvVarsEnabled,
  getNodeModulePackageName,
  matchesPackage,
} from '../../common';

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

describe(getNodeModuleInlineEnvVarsEnabled, () => {
  const PROD_NODE_MODULE = {
    name: 'metro',
    isDev: false,
    isHMREnabled: true,
    isNodeModule: true,
  };

  it(`should enable for a production node_module`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled(PROD_NODE_MODULE)).toBe(true);
  });

  it(`should disable in development`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled({ ...PROD_NODE_MODULE, isDev: true })).toBe(false);
  });

  it(`should disable for app code`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled({ ...PROD_NODE_MODULE, isNodeModule: false })).toBe(
      false
    );
  });

  it(`should disable on servers`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled({ ...PROD_NODE_MODULE, isServer: true })).toBe(false);
  });

  it(`should disable for webpack`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled({ ...PROD_NODE_MODULE, name: 'babel-loader' })).toBe(
      false
    );
  });

  it(`should disable when preserveEnvVars is set`, () => {
    expect(getNodeModuleInlineEnvVarsEnabled({ ...PROD_NODE_MODULE, preserveEnvVars: true })).toBe(
      false
    );
  });
});

describe(getNodeModulePackageName, () => {
  it(`should extract an unscoped package name`, () => {
    expect(getNodeModulePackageName('/app/node_modules/expo/build/index.js')).toBe('expo');
  });

  it(`should extract a scoped package name`, () => {
    expect(getNodeModulePackageName('/app/node_modules/@expo/metro-config/build/index.js')).toBe(
      '@expo/metro-config'
    );
  });

  it(`should not treat a node_modules substring in another segment as node_modules`, () => {
    expect(getNodeModulePackageName('/app/my_node_modules_dir/pkg/index.js')).toBeUndefined();
  });

  it(`should use the last node_modules segment for nested and pnpm layouts`, () => {
    expect(getNodeModulePackageName('/app/node_modules/a/node_modules/b/index.js')).toBe('b');
    expect(
      getNodeModulePackageName('/app/node_modules/.pnpm/expo@56.0.0/node_modules/expo/build/x.js')
    ).toBe('expo');
  });

  it(`should handle Windows path separators`, () => {
    expect(getNodeModulePackageName('C:\\app\\node_modules\\@acme\\shared\\index.js')).toBe(
      '@acme/shared'
    );
  });

  it(`should return undefined for app code`, () => {
    expect(getNodeModulePackageName('/app/src/index.js')).toBeUndefined();
  });
});

describe(matchesPackage, () => {
  it(`should match exact package names`, () => {
    expect(matchesPackage('expo', ['expo', '@expo'])).toBe(true);
  });

  it(`should match a whole scope via a trailing /*`, () => {
    expect(matchesPackage('@expo/metro-config', ['@expo/*'])).toBe(true);
    expect(matchesPackage('@acme/utils', ['@acme/*'])).toBe(true);
  });

  it(`should treat a bare scope as an exact name, not a wildcard`, () => {
    expect(matchesPackage('@expo/cli', ['@expo'])).toBe(false);
  });

  it(`should not match prefix-only collisions`, () => {
    expect(matchesPackage('expo-router', ['expo'])).toBe(false);
  });

  it(`should not match when the package is absent from the allowlist`, () => {
    expect(matchesPackage('some-third-party', ['expo', '@expo'])).toBe(false);
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

function inlineInNodeModule(
  filename: string,
  {
    platform,
    isDev = false,
    inlineEnvVarsInPackages,
  }: { platform: string; isDev?: boolean; inlineEnvVarsInPackages?: string[] }
) {
  process.env.EXPO_PUBLIC_FOO = 'bar';
  return babel.transform(`const x = process.env.EXPO_PUBLIC_FOO;`, {
    ...DEF_OPTIONS,
    filename,
    presets:
      inlineEnvVarsInPackages != null
        ? [[preset, { inlineEnvVarsInPackages }]]
        : DEF_OPTIONS.presets,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform, isDev, isNodeModule: true }),
  })!.code;
}

it(`inlines EXPO_PUBLIC_* in a default-allow-listed (expo) node module in production`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/expo/build/winter/runtime.native.js', {
    platform: 'android',
  });

  expect(contents).toMatch('bar');
  expect(contents).not.toMatch('EXPO_PUBLIC_FOO');
});

it(`inlines EXPO_PUBLIC_* in a user-configured package in production`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/@acme/shared/dist/index.js', {
    platform: 'macos',
    inlineEnvVarsInPackages: ['@acme/shared'],
  });

  expect(contents).toMatch('bar');
  expect(contents).not.toMatch('EXPO_PUBLIC_FOO');
});

it(`keeps inlining expo packages when a custom list is provided (extends, not replaces)`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/expo/build/index.js', {
    platform: 'tvos',
    inlineEnvVarsInPackages: ['@acme/shared'],
  });

  expect(contents).toMatch('bar');
  expect(contents).not.toMatch('EXPO_PUBLIC_FOO');
});

it(`does not inline in a non-listed node module in production`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/some-third-party/index.js', {
    platform: 'ios',
  });

  expect(contents).toMatch('EXPO_PUBLIC_FOO');
  expect(contents).not.toMatch('bar');
});

it(`does not match prefix-only collisions like expo-router for the expo entry`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/expo-router/build/index.js', {
    platform: 'web',
  });

  expect(contents).toMatch('EXPO_PUBLIC_FOO');
  expect(contents).not.toMatch('bar');
});

it(`does not inline in a listed node module in development`, () => {
  const contents = inlineInNodeModule('/proj/node_modules/expo/build/index.js', {
    platform: 'android',
    isDev: true,
  });

  expect(contents).toMatch('EXPO_PUBLIC_FOO');
  expect(contents).not.toMatch('bar');
});

it(`does not inline in a listed node module on the server`, () => {
  process.env.EXPO_PUBLIC_FOO = 'bar';

  const contents = babel.transform(`const x = process.env.EXPO_PUBLIC_FOO;`, {
    ...DEF_OPTIONS,
    filename: '/proj/node_modules/expo/build/index.js',
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
      isNodeModule: true,
      isServer: true,
    }),
  })!.code;

  expect(contents).toMatch('EXPO_PUBLIC_FOO');
  expect(contents).not.toMatch('bar');
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
