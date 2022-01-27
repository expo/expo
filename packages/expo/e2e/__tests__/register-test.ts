/* eslint-env jest */
import fs from 'fs/promises';

import { execute, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '1';
  process.env.CI = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('runs `npx expo register --help`', async () => {
  const results = await execute('register', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
          [1mDescription[22m
            Sign up for a new Expo account

          [1mUsage[22m
            $ npx expo register

          Options
          -h, --help    Output usage information
        "
  `);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'register');
  } catch (e) {
    expect(e.stderr).toMatch(/Invalid project root: \//);
  }
});

it('runs `npx expo register` and throws due to CI', async () => {
  expect.assertions(1);
  try {
    console.log(await execute('register'));
  } catch (e) {
    expect(e.stderr).toMatch(/Cannot register an account in CI/);
  }
});
