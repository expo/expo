/* eslint-env jest */
import fs from 'fs/promises';

import { execute, getLoadedModulesAsync, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build-cli/cli/logout');`);
  expect(modules).toStrictEqual([
    'node_modules/ansi-styles/index.js',
    'node_modules/arg/index.js',
    'node_modules/chalk/source/index.js',
    'node_modules/chalk/source/util.js',
    'node_modules/has-flag/index.js',
    'node_modules/supports-color/index.js',
    'packages/expo/build-cli/cli/log.js',
    'packages/expo/build-cli/cli/logout/index.js',
    'packages/expo/build-cli/cli/utils/args.js',
    'packages/expo/build-cli/cli/utils/errors.js',
  ]);
});

it('runs `npx expo logout --help`', async () => {
  const results = await execute('logout', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
          [1mDescription[22m
            Logout of an Expo account

          [1mUsage[22m
            $ npx expo logout

          Options
          -h, --help    Output usage information
        "
  `);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'logout');
  } catch (e) {
    expect(e.stderr).toMatch(/Invalid project root: \//);
  }
});
