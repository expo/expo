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
        1  invalid usage — a mistyped flag or unsupported --platform/--app-id combination
        2  rebuild required — run npx expo run:<platform>
        3  prebuild required — run npx expo prebuild, then rebuild
        4  cannot determine — no device, app not installed, no embedded fingerprint, or an error
    "
  `);
});

it.each([
  {
    name: 'an unsupported --platform value',
    args: ['needs-rebuild', '--platform', 'web'],
    message: /Unsupported platform: web/,
  },
  {
    name: 'a mistyped flag',
    args: ['needs-rebuild', '--platfrom', 'ios'],
    message: /unknown or unexpected option/i,
  },
])('exits with code 1 on $name', async ({ args, message }) => {
  const error: any = await executeExpoAsync(projectRoot, args, {
    verbose: false,
  }).catch((error) => error);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toMatch(message);
  // Exit code 1 is reserved exclusively for bad input, so it never doubles as a check result.
  // A mistyped flag reaches it through the shared `assertArgs` every command uses; an
  // unsupported --platform value is the same category of error, so it gets the same code.
  expect(error.exitCode).toBe(1);
});
