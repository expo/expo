/* eslint-env jest */
import fs from 'fs/promises';

import { projectRoot } from './utils';
import { executeExpoAsync } from '../utils/expo';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('runs `npx expo --version`', async () => {
  const results = await executeExpoAsync(projectRoot, ['--version']);
  expect(results.stdout).toEqual(require('../../package.json').version);
});
it('runs `npx expo -v`', async () => {
  const results = await executeExpoAsync(projectRoot, ['-v']);
  expect(results.stdout).toEqual(require('../../package.json').version);
});
it('asserts with a deprecated command `npx expo send`', async () => {
  await expect(executeExpoAsync(projectRoot, ['send'], { verbose: false })).rejects.toThrow(
    /expo send is deprecated/
  );
});

it('runs `npx expo --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Usage
        $ npx expo <command>

      Commands
        start, export
        run:ios, run:android, prebuild
        install, customize, config, serve
        login, logout, whoami, register

      Options
        --version, -v   Version number
        --help, -h      Usage info

      For more info run a command with the --help flag
        $ npx expo start --help
    "
  `);
});
