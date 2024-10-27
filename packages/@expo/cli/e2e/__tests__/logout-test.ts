/* eslint-env jest */
import { ExecaError } from 'execa';
import fs from 'fs/promises';

import { execute, getLoadedModulesAsync, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/logout');`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/logout/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo logout --help`', async () => {
  const results = await execute('logout', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Log out of an Expo account

      Usage
        $ npx expo logout

      Options
        -h, --help    Usage info
    "
  `);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'logout');
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/Invalid project root: \//);
  }
});
