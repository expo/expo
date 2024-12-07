/* eslint-env jest */
import JsonFile from '@expo/json-file';
import type { ExecaError } from 'execa';
import fs from 'fs/promises';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  findProjectFiles,
} from './utils';
import { executeExpoAsync, executeInstallAsync } from '../utils/expo';

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
  const results = await execute('install', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Install a module or other package to a project

      Usage
        $ npx expo install

      Options
        --check     Check which installed packages need to be updated
        --fix       Automatically update any invalid package versions
        --npm       Use npm to install dependencies. Default when package-lock.json exists
        --yarn      Use Yarn to install dependencies. Default when yarn.lock exists
        --bun       Use bun to install dependencies. Default when bun.lockb exists
        --pnpm      Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        -h, --help  Usage info

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

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  // Added expected package
  const pkgDependencies = pkg.dependencies as Record<string, string>;
  expect(pkgDependencies['expo-sms']).toBe('~13.0.0');
  expect(pkg.devDependencies).toEqual({
    '@babel/core': '^7.25.2',
  });

  // Added new packages
  expect(Object.keys(pkg.dependencies ?? {}).sort()).toStrictEqual([
    'expo',
    'expo-sms',
    'react',
    'react-native',
  ]);

  expect(findProjectFiles(projectRoot)).toStrictEqual([
    'App.js',
    'app.json',
    'bun.lockb',
    'metro.config.js',
    'package.json',
  ]);
});

it('runs `npx expo install --check` fails', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('install-check-fail', 'with-blank', {
    reuseExisting: false,
  });

  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

  // Install wrong package versions of `expo-sms` and `expo-auth-session`
  await executeInstallAsync(projectRoot, ['expo-sms@1.0.0', 'expo-auth-session@1.0.0']);

  // Ensure the wrong versions are installed
  expect(pkg.read().dependencies).toMatchObject({
    'expo-sms': '1.0.0',
    'expo-auth-session': '1.0.0',
  });

  // Ensure `expo install --check` throws for all wrong packages
  try {
    await executeExpoAsync(projectRoot, ['install', '--check'], { verbose: false });
    throw new Error('SHOULD NOT HAPPEN');
  } catch (e) {
    const error = e as ExecaError;
    expect(error.stderr).toMatch(/expo-auth-session@1\.0\.0 - expected version: ~\d\.\d\.\d/);
    expect(error.stderr).toMatch(/expo-sms@1\.0\.0 - expected version: ~\d+\.\d\.\d/);
  }

  // Ensure `expo install --check <package>` only throws for the selected package
  await expect(
    executeExpoAsync(projectRoot, ['install', 'expo-sms', '--check'], { verbose: false })
  ).rejects.toThrow(/expo-sms@1\.0\.0 - expected version: ~\d+\.\d\.\d/);

  // Ensure `--check` did not fix the version
  expect(pkg.read().dependencies).toMatchObject({
    'expo-sms': '1.0.0',
    'expo-auth-session': '1.0.0',
  });
});

it('runs `npx expo install --fix` fails', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('install-fix-fail', 'with-blank', {
    reuseExisting: false,
  });

  // Install wrong package versions of `expo-sms` and `expo-auth-session`
  await executeInstallAsync(projectRoot, ['expo-sms@1.0.0', 'expo-auth-session@1.0.0']);

  // Load the installed and expected dependency versions
  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));
  const expectedVersion = await JsonFile.readAsync(
    require.resolve('expo/bundledNativeModules.json', { paths: [projectRoot] })
  );

  // Only fix `expo-sms`
  await executeExpoAsync(projectRoot, ['install', '--fix', 'expo-sms']);

  // Ensure `expo-sms` is fixed to match the expected version
  expect(pkg.read().dependencies).toMatchObject({
    'expo-sms': expectedVersion['expo-sms'],
  });

  // Ensure `expo-auth-session` is still invalid
  await expect(
    executeExpoAsync(projectRoot, ['install', '--check'], { verbose: false })
  ).rejects.toThrow();

  // Ensure `--check` didn't fix the version
  expect(pkg.read().dependencies).toMatchObject({
    'expo-auth-session': '1.0.0',
  });

  // Fix all versions
  await executeExpoAsync(projectRoot, ['install', '--fix']);

  // Ensure both `expo-sms` and `expo-auth-session` are fixed
  expect(pkg.read().dependencies).toMatchObject({
    'expo-sms': expectedVersion['expo-sms'],
    'expo-auth-session': expectedVersion['expo-auth-session'],
  });
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

describe('expo-router integration', () => {
  it('runs `npx expo install --fix`', async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      'install-expo-router-integration',
      'with-router',
      {
        reuseExisting: false,
        sdkVersion: '52.0.0',
        linkExpoPackages: ['expo-router'],
      }
    );
    const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

    // Add a package that requires "fixing" when using canary
    await executeExpoAsync(projectRoot, ['install', '@react-navigation/native@6.1.18']);

    // Ensure `@react-navigation/native` is installed
    expect(pkg.read().dependencies).toMatchObject({
      '@react-navigation/native': '6.1.18',
    });

    // Run `--fix` project dependencies with expo@52 and expo-router from source
    await executeExpoAsync(projectRoot, ['install', '--fix']);

    // Ensure `@react-navigation/native` was updated
    expect(pkg.read().dependencies).toMatchObject({
      '@react-navigation/native': '^7.0.0',
    });
  });
});

it('verbose logging through `executeAsync` will always show for unexpected errors', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'install-expo-canary-fix',
    'with-blank'
  );

  await executeExpoAsync(projectRoot, ['install', 'thispackagedoesntexist']);

  expect(true).toBeTruthy();
});
