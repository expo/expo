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
