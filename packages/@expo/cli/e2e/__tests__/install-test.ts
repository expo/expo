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
  expect(results.stdout).toMatchInlineSnapshot();
});

it(
  'runs `npx expo install expo-sms`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-install', 'with-blank');
    // `npx expo prebuild --no-install`
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

    // Deleted
    expect(pkg.dependencies['expo-sms']).toBe('4.3.0');
    expect(pkg.devDependencies).toEqual({});

    // Added new packages
    expect(Object.keys(pkg.dependencies).sort()).toStrictEqual([
      'expo',
      'expo-splash-screen',
      'expo-status-bar',
      'react',
      'react-dom',
      'react-native',
      'react-native-web',
    ]);

    expect(files).toStrictEqual(['package.json']);
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);
