import * as babel from '@babel/core';

import preset from '..';

type Caller = {
  name: string;
  platform: string;
  isHMREnabled: boolean;
  isDev: boolean;
  isServer: boolean;
  isNodeModule: boolean;
};

const ENABLED_CALLER: Caller = {
  name: 'metro',
  platform: 'ios',
  isHMREnabled: true,
  isDev: true,
  isServer: false,
  isNodeModule: false,
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
      isHMREnabled: false,
    },
    {
      isServer: true,
    },
    {
      isDev: false,
    },
    {
      isNodeModule: true,
    },
  ] as Partial<Caller>[]
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
