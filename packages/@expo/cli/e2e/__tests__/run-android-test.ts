/* eslint-env jest */
import fs from 'fs/promises';

import { execute, getLoadedModulesAsync, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(
    `require('../../build/src/run/android').expoRunAndroid`
  );
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/run/android/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo run:android --help`', async () => {
  const results = await execute('run:android', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Description
        Run the native Android app locally

      Usage
        $ npx expo run:android <dir>

      Options 
        --no-build-cache       Clear the native build cache
        --no-install           Skip installing dependencies
        --no-bundler           Skip starting the bundler
        --variant <name>       Build variant. Default: debug
        -d, --device [device]  Device name to run the app on
        -p, --port <port>      Port to start the dev server on. Default: 8081
        -h, --help             Output usage information
    "
  `);
});
