/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';

import { executeExpoAsync } from '../utils/expo';
import { createPackageTarball } from '../utils/package';
import { projectRoot, getLoadedModulesAsync, setupTestProjectWithOptionsAsync } from './utils';

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
        --expo-only Only check or fix packages from Expo
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

it('installs a local package tarball without network access', async () => {
  const offlineEnv = {
    EXPO_OFFLINE: '1',
    EXPO_NO_NEW_ARCH_COMPAT_CHECK: '1',
    npm_config_offline: 'true',
    HTTP_PROXY: 'http://127.0.0.1:9',
    HTTPS_PROXY: 'http://127.0.0.1:9',
    NO_PROXY: '',
  };
  const originalEnv = Object.fromEntries(
    Object.keys(offlineEnv).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, offlineEnv);

  try {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      'local-package-install',
      'with-blank',
      {
        reuseExisting: false,
      }
    );
    const tarball = await createPackageTarball(
      projectRoot,
      'packages/@expo/cli/e2e/fixtures/install-smoke-package'
    );

    await expect(
      executeExpoAsync(projectRoot, ['install', tarball.packageReference, '--', '--offline'], {
        env: offlineEnv,
      })
    ).resolves.toMatchObject({ exitCode: 0 });

    const pkg: any = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));
    expect(pkg.dependencies?.[tarball.name]).toEqual(expect.any(String));
    expect(require.resolve(tarball.name, { paths: [projectRoot] })).toEqual(expect.any(String));
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
