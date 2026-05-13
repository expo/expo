import * as babel from '@babel/core';
import type { ExpoBabelCaller } from '@expo/metro-config/build/babel-transformer';

import preset from '..';

const ENABLED_CALLER: ExpoBabelCaller = {
  name: 'metro',
  platform: 'ios',
  projectRoot: '.',
  isDev: true,
  isServer: false,
  isNodeModule: false,
  isHMREnabled: true,
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',
  babelrc: false,
  presets: [[preset, { disableImportExportTransform: true }]],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

(
  [
    {
      isServer: true,
    },
    {
      isDev: false,
    },
    {
      isNodeModule: true,
    },
  ] as Partial<ExpoBabelCaller>[]
).forEach((caller) => {
  const key = Object.entries(caller)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  it(`does not inject react refresh with caller: ${key}`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, ...caller }),
    };

    const sourceCode = `
  export default function App() {
    return null;
  }`;

    const contents = babel.transform(sourceCode, options)!.code;
    expect(contents).not.toMatch('$RefreshReg$(_c, "App");');
  });
});

it(`does not inject react refresh without caller info`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'jest' }),
  };

  const sourceCode = `
  export default function App() {
    return null;
  }`;

  const contents = babel.transform(sourceCode, options)!.code;
  expect(contents).not.toMatch('$RefreshReg$(_c, "App");');
});

it(`injects react refresh with the caller`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER }),
  };

  const sourceCode = `
  export default function App() {
    return null;
  }`;

  const contents = babel.transform(sourceCode, options)!.code;
  expect(contents).toMatch('$RefreshReg$(_c, "App");');
});
