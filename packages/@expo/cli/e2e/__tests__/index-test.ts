/* eslint-env jest */
import fs from 'fs/promises';

import { execute, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('runs `npx expo --version`', async () => {
  const results = await execute('--version');
  expect(results.stdout).toEqual(require('../../package.json').version);
});
it('runs `npx expo -v`', async () => {
  const results = await execute('-v');
  expect(results.stdout).toEqual(require('../../package.json').version);
});

it('runs `npx expo --help`', async () => {
  const results = await execute('--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
        Usage
          $ npx expo <command>

        Available commands
          config, export, install, login, logout, prebuild, register, run:android, start, whoami

        Options
          --version, -v   Version number
          --help, -h      Displays this message

        For more information run a command with the --help flag
          $ expo start --help
      "
  `);
});
