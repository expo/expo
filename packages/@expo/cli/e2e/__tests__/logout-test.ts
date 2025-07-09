/* eslint-env jest */
import fs from 'fs/promises';

import { getLoadedModulesAsync, projectRoot } from './utils';
import { executeExpoAsync } from '../utils/expo';

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
  const results = await executeExpoAsync(projectRoot, ['logout', '--help']);
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
  await expect(
    executeExpoAsync(projectRoot, ['very---invalid', 'logout'], { verbose: false })
  ).rejects.toThrow(/^Invalid project root: .*very---invalid$/m);
});
