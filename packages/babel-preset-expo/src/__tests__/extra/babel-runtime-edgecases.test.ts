import * as babel from '@babel/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

import preset from '../..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

it('does not skip inner async function generator', () => {
  const sample = fs.readFileSync(
    path.join(__dirname, '../samples/trpc-server-resolveResponse.js'),
    'utf8'
  );
  const options = {
    babelrc: false,
    presets: [[preset, { enableBabelRuntime: true }]],
    sourceMaps: false,
    filename: '/unknown',
    configFile: false,
    compact: false,
    comments: true,
    retainLines: true,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isHMREnabled: false,
      isDev: false,
      isServer: false,
      isNodeModule: false,
    }),
  };

  // All of this code should remain intact.
  const output = babel.transform(sample, options)!;

  expect(output).not.toMatch(/async function\s+[*]/);
  expect(output.code).toMatchSnapshot();
});
