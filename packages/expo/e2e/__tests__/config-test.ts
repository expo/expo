/* eslint-env jest */
import fs from 'fs-extra';
import path from 'path';

import { execute, projectRoot, getRoot } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdirp(projectRoot);
  process.env.FORCE_COLOR = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('runs `npx expo config --help`', async () => {
  const results = await execute('config', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
          [1mDescription[22m
            Show the project config

          [1mUsage[22m
            $ expo config <dir>

          <dir> is the directory of the Expo project.
          Defaults to the current working directory.

          Options
          --full                                   Include all project config data
          --json                                   Output in JSON format
          -t, --type <public|prebuild|introspect>  Type of config to show
          -h, --help                               Output usage information
        "
  `);
});

it('runs `npx expo config --json`', async () => {
  const projectName = 'basic-config';
  const projectRoot = getRoot(projectName);
  // Create the project root aot
  await fs.mkdirp(projectRoot);
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  fs.writeFileSync(path.join(projectRoot, 'package.json'), '{ "version": "1.0.0" }');
  fs.writeFileSync(path.join(projectRoot, 'app.json'), '{ "expo": { "name": "foobar" } }');

  const results = await execute(projectName, 'config', '--json');

  // @ts-ignore
  const exp = JSON.parse(results.stdout);

  expect(exp.name).toEqual('foobar');
  expect(exp.slug).toEqual('foobar');
  expect(exp.platforms).toStrictEqual([]);
  expect(exp.version).toBe('1.0.0');
  expect(exp._internal.dynamicConfigPath).toBe(null);
  expect(exp._internal.staticConfigPath).toMatch(/\/basic-config\/app\.json$/);
});

it('throws on invalid project root', async () => {
  expect.assertions(1);
  try {
    await execute('very---invalid', 'config', '--json');
  } catch (e) {
    expect(e.stderr).toMatch(/Invalid project root: \/private\//);
  }
});
