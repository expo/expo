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
  const modules = await getLoadedModulesAsync(`require('../../build/src/compile').expoCompile`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/compile/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo compile --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['compile', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Build the native app binary locally

      Usage
        $ npx expo compile <android|ios>

      Options
        $ npx expo compile <android|ios> --help  Output usage information
    "
  `);
});

it('runs `npx expo compile android --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['compile', 'android', '--help']);
  expect(results.stdout).toContain('› Using expo compile:android --help');
  expect(results.stdout).toContain('Build the Android app binary locally');
});

it('runs `npx expo compile ios --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['compile', 'ios', '--help']);
  expect(results.stdout).toContain('› Using expo compile:ios --help');
  expect(results.stdout).toContain('Build the iOS app binary locally');
});
