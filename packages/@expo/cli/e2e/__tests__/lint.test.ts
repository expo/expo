/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import {
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  findProjectFiles,
} from './utils';
import { executeExpoAsync } from '../utils/expo';
import { executeAsync } from '../utils/process';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/lint').expoLint`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/lint/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo lint --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['lint', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Utility to run ESLint. Prompts to install and configure if not yet set up.

      Usage
        $ npx expo lint

      Options
        -h, --help    Usage info
    "
  `);
});

it('runs `npx expo lint` to install lint in a project', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-lint', 'with-blank', {
    reuseExisting: false,
  });

  // `npx expo install expo-sms`
  await executeExpoAsync(projectRoot, ['lint']);

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Ensure the config was added
  expect(pkg.devDependencies).toHaveProperty('eslint-config-expo');
  // And not in the dependencies
  expect(pkg.dependencies).not.toHaveProperty('eslint-config-expo');

  // Ensure the eslint package was added
  expect(pkg.devDependencies).toHaveProperty('eslint');

  // Check if the helper script was added
  expect(pkg.scripts).toHaveProperty('lint');

  expect(findProjectFiles(projectRoot)).toStrictEqual([
    '.eslintrc.js',
    'App.js',
    'app.json',
    'bun.lockb',
    'metro.config.js',
    'package.json',
  ]);

  // Ensure there are no linting errors
  await executeAsync(projectRoot, ['bun', 'run', 'lint', '--max-warnings', '0']);
});

it('runs `npx expo customize .eslintrc.js` to install lint in a project', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('customize-lint', 'with-blank', {
    reuseExisting: false,
  });

  // `npx expo customize .eslintrc.js`
  await executeExpoAsync(projectRoot, ['customize', '.eslintrc.js']);

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Ensure the config was added
  expect(pkg.devDependencies).toHaveProperty('eslint-config-expo');
  // And not in the dependencies
  expect(pkg.dependencies).not.toHaveProperty('eslint-config-expo');

  // Ensure the eslint package was added
  expect(pkg.devDependencies).toHaveProperty('eslint');

  // Check if the helper script was added
  expect(pkg.scripts).toHaveProperty('lint');

  expect(findProjectFiles(projectRoot)).toStrictEqual([
    '.eslintrc.js',
    'App.js',
    'app.json',
    'bun.lockb',
    'metro.config.js',
    'package.json',
  ]);

  // Ensure there are no linting errors
  await executeAsync(projectRoot, ['bun', 'run', 'lint', '--max-warnings', '0']);
});
