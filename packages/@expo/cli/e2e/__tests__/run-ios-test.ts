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
  const modules = await getLoadedModulesAsync(`require('../../build/src/run/ios').expoRunIos`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/run/ios/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo run:ios --help`', async () => {
  const results = await execute('run:ios', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Run the iOS app binary locally

      Usage
        $ npx expo run:ios

      Options
        --no-build-cache                 Clear the native derived data before building
        --no-install                     Skip installing dependencies
        --no-bundler                     Skip starting the Metro bundler
        --scheme [scheme]                Scheme to build
        --configuration <configuration>  Xcode configuration to use. Debug or Release. Default: Debug
        -d, --device [device]            Device name or UDID to build the app on
        -p, --port <port>                Port to start the Metro bundler on. Default: 8081
        -h, --help                       Usage info

      Build for production (unsigned) with the Release configuration:
        $ npx expo run:ios --configuration Release
    "
  `);
});
