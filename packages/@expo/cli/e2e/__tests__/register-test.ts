/* eslint-env jest */
import fs from 'fs/promises';

import { getLoadedModulesAsync, projectRoot } from './utils';
import { executeExpoAsync } from '../utils/expo';

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
  const modules = await getLoadedModulesAsync(`require('../../build/src/register');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/register/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo register --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['register', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Sign up for a new Expo account

      Usage
        $ npx expo register

      Options
        -h, --help    Usage info
    "
  `);
});

it('throws on invalid project root', async () => {
  await expect(
    executeExpoAsync(projectRoot, ['very---invalid', 'register'], { verbose: false })
  ).rejects.toThrow(/^Invalid project root: .*very---invalid$/m);
});

it('runs `npx expo register` and throws due to CI', async () => {
  await expect(executeExpoAsync(projectRoot, ['register'], { verbose: false })).rejects.toThrow(
    /Cannot register an account in CI/
  );
});
