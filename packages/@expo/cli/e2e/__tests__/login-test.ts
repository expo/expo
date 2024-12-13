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
  const modules = await getLoadedModulesAsync(`require('../../build/src/login');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/login/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo login --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['login', '--help']);
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
        -s, --sso                Log in with SSO
        -h, --help               Usage info
    "
  `);
});

it('throws on invalid project root', async () => {
  await expect(
    executeExpoAsync(projectRoot, ['very---invalid', 'login'], { verbose: false })
  ).rejects.toThrow(/^Invalid project root: .*very---invalid$/m);
});

it('runs `npx expo login` and throws due to CI', async () => {
  await expect(executeExpoAsync(projectRoot, ['login'], { verbose: false })).rejects.toThrow(
    /Input is required/
  );
  await expect(executeExpoAsync(projectRoot, ['login'], { verbose: false })).rejects.toThrow(
    /Use the EXPO_TOKEN environment variable to authenticate in CI/
  );
});

it('runs `npx expo login` and throws due to invalid credentials', async () => {
  await expect(
    executeExpoAsync(projectRoot, ['login', '--username=bacon', '--password=invalid'], {
      verbose: false,
    })
  ).rejects.toThrow(/Your username, email, or password was incorrect/);
});
