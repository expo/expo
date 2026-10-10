import fs from 'fs/promises';

import { executeExpoAsync } from '../utils/expo';
import { getLoadedModulesAsync, projectRoot } from './utils';

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
    `require('../../build/src/compile/ios').expoCompileIos`
  );
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/compile/args.js',
    '@expo/cli/build/src/compile/ios/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo compile:ios --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['compile:ios', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Build the iOS app binary locally

      Usage
        $ npx expo compile:ios <dir>

      Options
        <dir>                    Directory of the Expo project. Default: Current working directory
        --dev                    Build in development mode
        --prod                   Build in production mode (default)
        --device <device>        Device name or ID to build the app for
        --output-dir <dir>       Directory to copy the built app to
        --output-type <app|ipa>  Type of app binary to build
        -h, --help               Usage info

      Build the app in development mode:
        $ npx expo compile:ios --dev

      Copy the built app into a folder in your project:
        $ npx expo compile:ios --dev --output-dir ./build
    "
  `);
});
