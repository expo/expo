import * as babel from '@babel/core';
import * as path from 'node:path';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const options: babel.TransformOptions = {
  sourceType: 'unambiguous',
  caller: getCaller({
    name: 'metro',
    supportsReactCompiler: true,
    engine: 'hermes',
    platform: 'ios',
    isDev: false,
  }),
  babelrc: false,
  presets: [preset],
  sourceMaps: false,

  compact: false,
  comments: true,
  retainLines: true,
};

it(`allows destructuring in the catch block`, () => {
  // Ensuring the transform doesn't throw.
  const { code } = babel.transformFileSync(
    path.resolve(__dirname, 'samples/destructure-catch.tsx'),
    options
  )!;

  expect(code).toMatchSnapshot();
  expect(code).not.toContain('react.memo_cache_sentinel');
});

it(`supports functions with discarded return values in try/catch blocks that run in memos`, () => {
  // Ensuring the transform doesn't throw.
  const { code } = babel.transformFileSync(
    path.resolve(__dirname, 'samples/try-catch-hook.tsx'),
    options
  )!;

  expect(code).toMatchSnapshot();
  expect(code).not.toContain('react.memo_cache_sentinel');
});

it(`supports memoizing`, () => {
  // Ensuring the transform doesn't throw.
  const { code } = babel.transformFileSync(path.resolve(__dirname, 'samples/App.tsx'), options)!;

  expect(code).toMatchSnapshot();
  expect(code).toContain('react.memo_cache_sentinel');
});

it(`supports disabling memoizing`, () => {
  // Ensuring the transform doesn't throw.
  const { code } = babel.transformFileSync(path.resolve(__dirname, 'samples/App.tsx'), {
    ...options,
    caller: getCaller({
      name: 'metro',
      supportsReactCompiler: false,
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
    }),
  })!;

  expect(code).not.toContain('react.memo_cache_sentinel');
});

it(`compiles to CJS 1`, () => {
  const code = babel.transformFileSync(path.resolve(__dirname, 'samples/compile-memo.tsx'), {
    ...options,
    caller: getCaller({
      name: 'metro',
      supportsReactCompiler: true,
      supportsStaticESM: false,
      engine: 'hermes',
      platform: 'ios',
      isDev: true,
    }),
  })!.code!;
  expect(code).not.toContain('import {');
  expect(code).toContain('react.memo_cache_sentinel');
});

// TODO: Known issue with compiler.
xit(`compiles React module with js extension in filename`, () => {
  const code = babel.transformSync(
    `
// import React from 'react';
// const React2 = require('react');
function App() {
  return <div />;
}
`,
    {
      ...options,
      // File name ending with `.js`
      filename: '/samples/App.js',
      // This is the default type used in Metro.
      sourceType: 'unambiguous',
      babelrc: false,
      comments: false,
      code: true,
      caller: getCaller({
        name: 'metro',
        platform: 'web',
        isServer: false,
        isReactServer: false,
        isDev: true,
        isNodeModule: false,
        isHMREnabled: true,
        supportsStaticESM: false,
        supportsReactCompiler: true,
      }),
    }
  )!.code!;
  expect(code).toContain('var _reactCompilerRuntime = ');
  expect(code).not.toContain('import ');
});

it(`skips memoizing in server bundling passes`, () => {
  const { code } = babel.transformFileSync(path.resolve(__dirname, 'samples/PureComponent.tsx'), {
    ...options,
    caller: getCaller({
      isServer: true,
      name: 'metro',
      supportsReactCompiler: true,
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
    }),
  })!;
  expect(code).not.toContain('react.memo_cache_sentinel');
});

it(`skips memoizing in react-server bundling passes`, () => {
  const { code } = babel.transformFileSync(path.resolve(__dirname, 'samples/PureComponent.tsx'), {
    ...options,
    caller: getCaller({
      isReactServer: true,
      name: 'metro',
      supportsReactCompiler: true,
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
    }),
  })!;
  expect(code).not.toContain('react.memo_cache_sentinel');
});

it(`skips memoizing in node modules`, () => {
  const { code } = babel.transformFileSync(path.resolve(__dirname, 'samples/PureComponent.tsx'), {
    ...options,
    caller: getCaller({
      isNodeModule: true,
      name: 'metro',
      supportsReactCompiler: true,
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
    }),
  })!;
  expect(code).not.toContain('react.memo_cache_sentinel');
});
