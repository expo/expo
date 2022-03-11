/* eslint-env jest */
import fs from 'fs/promises';
import path from 'path';

import { execute, projectRoot, getRoot, getLoadedModulesAsync } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build-cli/cli/config').expoConfig`);
  expect(modules).toStrictEqual([
    'node_modules/ansi-styles/index.js',
    'node_modules/arg/index.js',
    'node_modules/chalk/source/index.js',
    'node_modules/chalk/source/util.js',
    'node_modules/has-flag/index.js',
    'node_modules/supports-color/index.js',
    'packages/expo/build-cli/cli/config/index.js',
    'packages/expo/build-cli/cli/log.js',
    'packages/expo/build-cli/cli/utils/args.js',
  ]);
});

it('runs `npx expo config --help`', async () => {
  const results = await execute('config', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
          Description
            Show the project config

          Usage
            $ npx expo config <dir>

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
  await fs.mkdir(projectRoot, { recursive: true });
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  await fs.writeFile(path.join(projectRoot, 'package.json'), '{ "version": "1.0.0" }');
  await fs.writeFile(path.join(projectRoot, 'app.json'), '{ "expo": { "name": "foobar" } }');

  const results = await execute('config', projectName, '--json');
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
    await execute('config', 'very---invalid', '--json');
  } catch (e) {
    expect(e.stderr).toMatch(/Invalid project root: \//);
  }
});
