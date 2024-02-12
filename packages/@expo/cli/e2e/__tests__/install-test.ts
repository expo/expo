/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa, { ExecaError } from 'execa';
import fs from 'fs/promises';
import klawSync from 'klaw-sync';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  bin,
  setupTestProjectAsync,
  installAsync,
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

it('runs `npx install install --help`', async () => {
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

it(
  'runs `npx expo install expo-sms`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-install', 'with-blank');
    // `npx expo install expo-sms`
    await execa('node', [bin, 'install', 'expo-sms'], { cwd: projectRoot });

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
      .filter(Boolean);

    const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Added expected package
    const pkgDependencies = pkg.dependencies as Record<string, string>;
    expect(pkgDependencies['expo-sms']).toBe('~11.4.0');
    expect(pkg.devDependencies).toEqual({
      '@babel/core': '^7.20.0',
    });

    // Added new packages
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toStrictEqual([
      'expo',
      'expo-sms',
      'react',
      'react-native',
    ]);

    expect(files).toStrictEqual(['App.js', 'app.json', 'bun.lockb', 'package.json']);
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);

it(
  'runs `npx expo install --check` fails',
  async () => {
    const projectRoot = await setupTestProjectAsync('install-check-fail', 'with-blank');
    await installAsync(projectRoot, ['expo-sms@1.0.0', 'expo-auth-session@1.0.0']);

    let pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));
    // Added expected package
    let pkgDependencies = pkg.dependencies as Record<string, string>;
    expect(pkgDependencies['expo-sms']).toBe('1.0.0');

    try {
      await execa('node', [bin, 'install', '--check'], { cwd: projectRoot });
      throw new Error('SHOULD NOT HAPPEN');
    } catch (e) {
      const error = e as ExecaError;
      expect(error.stderr).toMatch(/expo-auth-session@1\.0\.0 - expected version: ~5\.\d\.\d/);
      expect(error.stderr).toMatch(/expo-sms@1\.0\.0 - expected version: ~11\.\d\.\d/);
    }

    await expect(
      execa('node', [bin, 'install', 'expo-sms', '--check'], { cwd: projectRoot })
    ).rejects.toThrowError(/expo-sms@1\.0\.0 - expected version: ~11\.\d\.\d/);

    // Check doesn't fix packages
    pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));
    // Added expected package
    pkgDependencies = pkg.dependencies as Record<string, string>;
    expect(pkgDependencies['expo-sms']).toBe('1.0.0');
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);

it(
  'runs `npx expo install --fix` fails',
  async () => {
    const projectRoot = await setupTestProjectAsync('install-fix-fail', 'with-blank');
    await installAsync(projectRoot, ['expo-sms@1.0.0', 'expo-auth-session@1.0.0']);

    await execa('node', [bin, 'install', '--fix', 'expo-sms'], { cwd: projectRoot });

    // Ensure the versions are invalid
    await expect(
      execa('node', [bin, 'install', '--check'], { cwd: projectRoot })
    ).rejects.toThrow();

    // Check doesn't fix packages
    let pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));
    // Added expected package
    let pkgDependencies = pkg.dependencies as Record<string, string>;
    expect(pkgDependencies['expo-sms']).toBe('~11.4.0');

    // Didn't fix expo-auth-session since we didn't pass it in
    expect(pkgDependencies['expo-auth-session']).toBe('1.0.0');

    // Fix all versions
    await execa('node', [bin, 'install', '--fix'], { cwd: projectRoot });

    // Check that the versions are fixed
    pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Didn't fix expo-auth-session since we didn't pass it in
    pkgDependencies = pkg.dependencies as Record<string, string>;
    expect(pkgDependencies['expo-auth-session']).toBe('~5.0.2');
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);

it(
  'runs `npx expo install expo@<version> --fix`',
  async () => {
    const projectRoot = await setupTestProjectAsync('install-expo-canary-fix', 'with-blank');
    const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

    // Add a package that requires "fixing" when using canary
    await execa('node', [bin, 'install', 'expo-dev-client'], { cwd: projectRoot });

    // Ensure `expo-dev-client` is installed
    expect(pkg.read().dependencies).toMatchObject({
      'expo-dev-client': expect.any(String),
    });

    // Add `expo@canary` to the project, and `--fix` project dependencies
    await execa('node', [bin, 'install', 'expo@canary', '--fix'], { cwd: projectRoot });

    // Ensure `expo-dev-client` is using canary version
    expect(pkg.read().dependencies).toMatchObject({
      'expo-dev-client': expect.stringContaining('canary'),
    });
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);
