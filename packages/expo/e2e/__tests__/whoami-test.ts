/* eslint-env jest */
import fs from 'fs/promises';
import os from 'os';

import { execute, projectRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('runs `npx expo whoami --help`', async () => {
  const results = await execute('whoami', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
          [1mDescription[22m
            Show the currently authenticated username

          [1mUsage[22m
            $ npx expo whoami

          Options
          -h, --help    Output usage information
        "
  `);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'whoami');
  } catch (e) {
    expect(e.stderr).toMatch(/Invalid project root: \//);
  }
});

it('runs `npx expo whoami`', async () => {
  const results = await execute('whoami').catch((e) => e);

  // Test logged in or logged out.
  if (results.stderr) {
    expect(results.stderr.trim()).toBe('Not logged in');
  } else {
    expect(results.stdout.trim()).toBe(expect.any(String));
    // Ensure this can always be used as a means of automation.
    expect(results.stdout.trim().split(os.EOL)).toBe(1);
  }
});

if (process.env.CI) {
  it('runs `npx expo whoami` and throws logged out error', async () => {
    expect.assertions(1);
    try {
      console.log(await execute('whoami'));
    } catch (e) {
      expect(e.stderr).toMatch(/Not logged in/);
    }
  });
}
