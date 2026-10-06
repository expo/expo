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
    `require('../../build/src/compile/android').expoCompileAndroid`
  );
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/compile/android/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo compile:android --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['compile:android', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Build the Android app binary locally

      Usage
        $ npx expo compile:android

      Options
        -h, --help    Usage info
    "
  `);
});
