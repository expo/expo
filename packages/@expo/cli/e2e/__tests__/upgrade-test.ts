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
  setupTestSDK45ProjectAsync,
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
  const modules = await getLoadedModulesAsync(`require('../../build/src/upgrade').expoUpgrade`);
  expect(modules).toStrictEqual([
    '../node_modules/arg/index.js',
    '../node_modules/chalk/node_modules/ansi-styles/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/upgrade/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo upgrade --help`', async () => {
  const results = await execute('upgrade', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Upgrade the React project to a newer version of Expo. Does not update native code.

      Usage
        $ npx expo upgrade

      Options
        --sdk-version  Expo SDK version to upgrade to
        --npm          Use npm to install dependencies. Default when package-lock.json exists
        --yarn         Use Yarn to install dependencies. Default when yarn.lock exists
        --pnpm         Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        -h, --help     Usage info
    "
  `);
});

it(
  'runs `npx expo upgrade --sdk-version 47`',
  async () => {
    const projectRoot = await setupTestSDK45ProjectAsync('basic-upgrade', 'with-outdated');
    // `npx expo install expo-sms`
    await execa('node', [bin, 'upgrade', '--sdk-version', '47'], { cwd: projectRoot });
    // `npx expo upgrade --finalize`
    // Run the finalize stage manually, we are using `npx expo` but in these tests we have to use `node ${bin}`.
    // When this step fails, the upgrade still continues, but with a warning to double-check the release post.
    await execa('node', [bin, 'upgrade', '--finalize'], { cwd: projectRoot });

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

    // Removed all outdated packages
    expect(pkgDependencies).toEqual({
      '@react-native-async-storage/async-storage': '~1.17.3',
      expo: '47.0.0',
      'expo-auth-session': '^3.8.0',
      'expo-random': '~13.0.0',
      react: '18.1.0',
      'react-native': '0.70.5',
    });
    expect(pkg.devDependencies).toEqual({
      '@babel/core': '^7.12.9',
    });

    expect(files).toStrictEqual(['App.js', 'app.json', 'package.json', 'yarn.lock']);
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);
