/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { executeExpoAsync } from '../utils/expo';
import {
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  findProjectFiles,
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
  const modules = await getLoadedModulesAsync(`require('../../build/src/install').expoInstall`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/install/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo install --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['install', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Install a module or other package to a project

      Usage
        $ npx expo install

      Options
        --check     Check which installed packages need to be updated
        --dev       Save the dependencies as devDependencies
        --fix       Automatically update any invalid package versions
        --npm       Use npm to install dependencies. Default when package-lock.json exists
        --yarn      Use Yarn to install dependencies. Default when yarn.lock exists
        --bun       Use bun to install dependencies. Default when bun.lock or bun.lockb exists
        --pnpm      Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        -h, --help  Usage info
        --json      Output dependency information in JSON format with --check flag

      Additional options can be passed to the underlying install command by using --
        $ npx expo install react -- --verbose
        > yarn add react --verbose
    "
  `);
});

it('runs `npx expo install expo-sms`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-install', 'with-blank', {
    reuseExisting: false,
  });

  // `npx expo install expo-sms`
  await executeExpoAsync(projectRoot, ['install', 'expo-sms']);

  const pkg: any = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Added expected package
  expect(pkg?.dependencies!['expo-sms']).toBeTruthy();

  expect(findProjectFiles(projectRoot)).toStrictEqual([
    'App.js',
    'app.json',
    'index.js',
    'metro.config.js',
    'package.json',
    'pnpm-lock.yaml',
  ]);
});

it('runs `npx expo install expo@<version> --fix`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'install-expo-canary-fix',
    'with-blank',
    {
      reuseExisting: false,
    }
  );
  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

  // Add a package that requires "fixing" when using canary
  await executeExpoAsync(projectRoot, ['install', 'expo-dev-client']);

  // Ensure `expo-dev-client` is installed
  expect(pkg.read().dependencies).toMatchObject({
    'expo-dev-client': expect.any(String),
  });

  // Add `expo@canary` to the project, and `--fix` project dependencies
  await executeExpoAsync(projectRoot, ['install', 'expo@canary', '--fix']);

  // Ensure `expo-dev-client` is using canary version
  expect(pkg.read().dependencies).toMatchObject({
    'expo-dev-client': expect.stringContaining('canary'),
  });
});

it('validates when with `EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo install --check`', async () => {
  const env = {
    EXPO_NO_DEPENDENCY_VALIDATION: '1',
  } as Partial<NodeJS.ProcessEnv> as NodeJS.ProcessEnv;
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'install-check-no-validation',
    'with-blank',
    {
      reuseExisting: false,
    }
  );
  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

  // Install wrong package version of `expo-image`
  await expect(
    executeExpoAsync(projectRoot, ['install', 'expo-image@1.0.0'], { env })
  ).resolves.toMatchObject({
    stdout: expect.stringContaining('Installing 1 other package using'),
  });

  // Ensure the wrong version is installed
  expect(pkg.read().dependencies).toMatchObject({ 'expo-image': '1.0.0' });

  // Ensure `expo install --check` does not throw when validation is disabled
  await expect(() => {
    return executeExpoAsync(projectRoot, ['install', '--check'], { env, verbose: false });
  }).rejects.toThrow(/Found outdated dependencies/);
});
