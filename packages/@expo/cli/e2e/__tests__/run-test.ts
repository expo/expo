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
  const modules = await getLoadedModulesAsync(`require('../../build/src/run').expoRun`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/run/hints.js',
    '@expo/cli/build/src/run/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/env.js',
    '@expo/cli/build/src/utils/errors.js',
    '@expo/cli/build/src/utils/interactive.js',
  ]);
});

it('runs `npx expo run --help`', async () => {
  const results = await execute('run', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Run the native app locally

      Usage
        $ npx expo run <android|ios>

      Options
        $ npx expo run <android|ios> --help  Output usage information
    "
  `);
});

it('runs `npx expo run android --help`', async () => {
  const results = await execute('run', 'android', '--help');
  expect(results.stdout).toMatchSnapshot();
});

it('runs `npx expo run ios --help`', async () => {
  const results = await execute('run', 'ios', '--help');
  expect(results.stdout).toMatchSnapshot();
});
