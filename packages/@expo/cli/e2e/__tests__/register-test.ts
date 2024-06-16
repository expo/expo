/* eslint-env jest */
import { ExecaError } from 'execa';
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
  const modules = await getLoadedModulesAsync(`require('../../build/src/register');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/register/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo register --help`', async () => {
  const results = await execute('register', '--help');
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
  expect.assertions(1);
  try {
    await execute('very---invalid', 'register');
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Invalid project root: \//);
  }
});

it('runs `npx expo register` and throws due to CI', async () => {
  expect.assertions(1);
  try {
    console.log(await execute('register'));
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Cannot register an account in CI/);
  }
});
