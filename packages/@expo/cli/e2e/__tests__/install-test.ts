/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import klawSync from 'klaw-sync';
import path from 'path';
import execa from 'execa';

import {
  execute,
  projectRoot,
  getRoot,
  getLoadedModulesAsync,
  bin,
  setupTestProjectAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/install').expoInstall`);
  expect(modules).toStrictEqual([
    '../node_modules/ansi-styles/index.js',
    '../node_modules/arg/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/install/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx install install --help`', async () => {
  const results = await execute('install', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Description
        Install a module or other package to a project

      Usage
        $ npx expo install [packages...] [options]

      Options
        --npm       Use npm to install dependencies. Default when package-lock.json exists
        --yarn      Use Yarn to install dependencies. Default when yarn.lock exists
        -h, --help  Output usage information

      Additional options can be passed to the underlying install command by using --
        $ expo install react -- --verbose
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
    expect(pkg.dependencies['expo-sms']).toBe('~10.1.0');
    expect(pkg.devDependencies).toEqual({
      '@babel/core': '^7.12.9',
    });

    // Added new packages
    expect(Object.keys(pkg.dependencies).sort()).toStrictEqual([
      'expo',
      'expo-sms',
      'react',
      'react-native',
    ]);

    expect(files).toStrictEqual(['App.js', 'app.json', 'package.json', 'yarn.lock']);
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);
