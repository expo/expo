import * as babel from '@babel/core';
import * as path from 'node:path';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const options = {
  caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: false }),
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
});
it(`supports functions with discarded return values in try/catch blocks that run in memos`, () => {
  // Ensuring the transform doesn't throw.
  const { code } = babel.transformFileSync(
    path.resolve(__dirname, 'samples/try-catch-hook.tsx'),
    options
  )!;

  expect(code).toMatchSnapshot();
});
