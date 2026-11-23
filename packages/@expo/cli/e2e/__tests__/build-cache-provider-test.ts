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
  // Without `expo` installed, `getConfig` needs the SDK version from the app config
  await fs.writeFile(
    path.join(projectRoot, 'app.json'),
    JSON.stringify({ expo: { sdkVersion: '58.0.0' } })
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

it('loads the `eas` build cache provider installed after a failed lookup in the same process', async () => {
  const installRoot = getTemporaryPath();
  await fs.mkdir(path.join(installRoot, 'node_modules'), { recursive: true });
  await fs.writeFile(
    path.join(installRoot, 'package.json'),
    JSON.stringify({ name: 'build-cache-provider-install-test', version: '1.0.0' })
  );
  await fs.writeFile(
    path.join(installRoot, 'app.json'),
    JSON.stringify({ expo: { sdkVersion: '58.0.0' } })
  );

  const results = await executeAsync(__dirname, [
    'node',
    '-e',
    `const fs = require('node:fs');
    const path = require('node:path');
    const projectRoot = process.argv[1];
    require('../../build/src/start/doctor/dependencies/getMissingPackages').collectMissingPackages(
      projectRoot,
      [{ pkg: 'eas-build-cache-provider', file: 'eas-build-cache-provider/package.json' }]
    );
    const providerRoot = path.join(projectRoot, 'node_modules', 'eas-build-cache-provider');
    fs.mkdirSync(path.join(providerRoot, 'build'), { recursive: true });
    fs.writeFileSync(
      path.join(providerRoot, 'package.json'),
      JSON.stringify({ name: 'eas-build-cache-provider', version: '1.0.0', main: 'build/index.js' })
    );
    fs.writeFileSync(
      path.join(providerRoot, 'build', 'index.js'),
      'exports.default = { resolveBuildCache() {}, uploadBuildCache() {} };'
    );
    require('../../build/src/utils/build-cache-providers')
      .resolveBuildCacheProvider('eas', projectRoot)
      .then(
        (provider) => console.log(JSON.stringify({
          resolveBuildCache: typeof provider?.plugin.resolveBuildCache,
          uploadBuildCache: typeof provider?.plugin.uploadBuildCache,
        })),
        (error) => console.log(JSON.stringify({ error: error.message }))
      );`,
    installRoot,
  ]);
  await fs.rm(installRoot, { recursive: true, force: true });

  expect(JSON.parse(results.stdout.trim())).toEqual({
    resolveBuildCache: 'function',
    uploadBuildCache: 'function',
  });
});
