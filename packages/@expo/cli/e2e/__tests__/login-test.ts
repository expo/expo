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
  const modules = await getLoadedModulesAsync(`require('../../build/src/login');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/login/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo login --help`', async () => {
  const results = await execute('login', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Log in to an Expo account

      Usage
        $ npx expo login

      Options
        -u, --username <string>  Username
        -p, --password <string>  Password
        --otp <string>           One-time password from your 2FA device
        -h, --help               Usage info
    "
  `);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'login');
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Invalid project root: \//);
  }
});

it('runs `npx expo login` and throws due to CI', async () => {
  expect.assertions(2);
  try {
    console.log(await execute('login'));
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Input is required/);
    expect(error.stderr).toMatch(/Use the EXPO_TOKEN environment variable to authenticate in CI/);
  }
});

it('runs `npx expo login` and throws due to invalid credentials', async () => {
  expect.assertions(1);
  try {
    console.log(await execute('login', '--username', 'bacon', '--password', 'invalid'));
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Your username, email, or password was incorrect/);
  }
});
