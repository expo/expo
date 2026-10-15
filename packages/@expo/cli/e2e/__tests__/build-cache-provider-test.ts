/* eslint-env jest */
import fs from 'node:fs/promises';
import path from 'node:path';

import { executeAsync } from '../utils/process';
import { getTemporaryPath } from './utils';

const projectRoot = getTemporaryPath();
const providerRoot = path.join(projectRoot, 'node_modules', 'eas-build-cache-provider');

beforeAll(async () => {
  await fs.mkdir(path.join(providerRoot, 'build'), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({ name: 'build-cache-provider-test', version: '1.0.0' })
  );
  await fs.writeFile(
    path.join(providerRoot, 'package.json'),
    JSON.stringify({ name: 'eas-build-cache-provider', version: '1.0.0', main: 'build/index.js' })
  );
  await fs.writeFile(
    path.join(providerRoot, 'build', 'index.js'),
    [
      `Object.defineProperty(exports, '__esModule', { value: true });`,
      `exports.default = { resolveBuildCache() {}, uploadBuildCache() {} };`,
    ].join('\n')
  );
});

afterAll(async () => {
  await fs.rm(projectRoot, { recursive: true, force: true });
});

it('loads the `eas` build cache provider from the built CLI', async () => {
  const results = await executeAsync(__dirname, [
    'node',
    '-e',
    `require('../../build/src/utils/build-cache-providers')
      .resolveBuildCacheProvider('eas', process.argv[1])
      .then((provider) => console.log(JSON.stringify({
        resolveBuildCache: typeof provider?.plugin.resolveBuildCache,
        uploadBuildCache: typeof provider?.plugin.uploadBuildCache,
      })));`,
    projectRoot,
  ]);
  expect(JSON.parse(results.stdout.trim())).toEqual({
    resolveBuildCache: 'function',
    uploadBuildCache: 'function',
  });
});
