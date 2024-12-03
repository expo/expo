/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs/promises';
import klawSync from 'klaw-sync';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  bin,
  setupTestProjectWithOptionsAsync,
} from './utils';

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
  const results = await execute('lint', '--help');
  expect(results.stdout).toMatchSnapshot();
});

it('runs `npx expo lint` to install lint in a project', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-lint', 'with-blank', {
    reuseExisting: false,
  });
  // `npx expo install expo-sms`
  await execa('node', [bin, 'lint'], { cwd: projectRoot });

  // List output files with sizes for snapshotting.
  // This is to make sure that any changes to the output are intentional.
  // Posix path formatting is used to make paths the same across OSes.
  const files = klawSync(projectRoot)
    .map((entry) => {
      if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
        return null;
      }
      return path.posix.relative(projectRoot, entry.path);
    })
    .filter(Boolean)
    .sort();

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Ensure the config was added
  expect((pkg.devDependencies as any)['eslint-config-expo']).toBeDefined();
  // And not in the dependencies
  expect((pkg.dependencies as any)['eslint-config-expo']).not.toBeDefined();

  // Ensure the eslint package was added
  expect((pkg.devDependencies as any)['eslint']).toBeDefined();

  // Check if the helper script was added
  expect((pkg.scripts as any)['lint']).toBeDefined();

  expect(files).toStrictEqual([
    '.eslintrc.js',
    'App.js',
    'app.json',
    'bun.lockb',
    'metro.config.js',
    'package.json',
  ]);

  await execa('bun', ['run', 'lint', '--max-warnings', '0'], { cwd: projectRoot });
});

it('runs `npx expo customize .eslintrc.js` to install lint in a project', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('customize-lint', 'with-blank', {
    reuseExisting: false,
  });
  // `npx expo install expo-sms`
  await execa('node', [bin, 'customize', '.eslintrc.js'], { cwd: projectRoot });

  // List output files with sizes for snapshotting.
  // This is to make sure that any changes to the output are intentional.
  // Posix path formatting is used to make paths the same across OSes.
  const files = klawSync(projectRoot)
    .map((entry) => {
      if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
        return null;
      }
      return path.posix.relative(projectRoot, entry.path);
    })
    .filter(Boolean)
    .sort();

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Ensure the config was added
  expect((pkg.devDependencies as any)['eslint-config-expo']).toBeDefined();
  // And not in the dependencies
  expect((pkg.dependencies as any)['eslint-config-expo']).not.toBeDefined();

  // Ensure the eslint package was added
  expect((pkg.devDependencies as any)['eslint']).toBeDefined();

  // Check if the helper script was added
  expect((pkg.scripts as any)['lint']).toBeDefined();

  expect(files).toStrictEqual([
    '.eslintrc.js',
    'App.js',
    'app.json',
    'bun.lockb',
    'metro.config.js',
    'package.json',
  ]);

  await execa('bun', ['run', 'lint', '--max-warnings', '0'], { cwd: projectRoot });
});
