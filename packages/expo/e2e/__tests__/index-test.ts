/* eslint-env jest */
import fs from 'fs/promises';

import { execute, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('runs `npx expo --version`', async () => {
  const results = await execute('--version');
  expect(results.stdout).toEqual(require('../../package.json').version);
});

it('runs `npx expo --help`', async () => {
  const results = await execute('--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
        [1mUsage[22m
          [1m$[22m npx expo <command>

        [1mAvailable commands[22m
          config

        [1mOptions[22m
          --version, -v   Version number
          --help, -h      Displays this message

        For more information run a command with the --help flag
          [1m$[22m expo start --help
      "
  `);
});
