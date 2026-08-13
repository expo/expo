/* eslint-env jest */
import fs from 'fs/promises';

import { executeExpoAsync } from '../utils/expo';
import { getLoadedModulesAsync, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/needsRebuild');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/needsRebuild/index.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo needs-rebuild --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['needs-rebuild', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Check whether the installed native app must be rebuilt

      Usage
        $ npx expo needs-rebuild <dir>

      Options
        <dir>                              Directory of the Expo project. Default: Current working directory
        -p, --platform <all|android|ios>   Platforms to check. Default: platforms with a reachable device
        -d, --device <name|udid|serial>    Only check the matching simulator or device
        --app-id <id>                      Application ID to look for. Default: resolved from the project; requires a single --platform
        --json                             Output the result as JSON
        -h, --help                         Usage info

      Exit codes
        0  up to date — a JS reload is enough
        1  rebuild required — run npx expo run:<platform>
        2  prebuild required — run npx expo prebuild, then rebuild
        3  cannot determine — no device, app not installed, no embedded fingerprint, or an error
    "
  `);
});

it('exits with code 3 on an invalid platform', async () => {
  const error: any = await executeExpoAsync(projectRoot, ['needs-rebuild', '--platform', 'web'], {
    verbose: false,
  }).catch((error) => error);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toMatch(/Unsupported platform: web/);
  // The exit code is the command's public API: 1 means "rebuild required", so usage
  // errors must surface as 3 (cannot determine), never as 1.
  expect(error.exitCode).toBe(3);
});
