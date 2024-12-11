/* eslint-env jest */
import fs from 'fs';
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
const originalUseTypedRoutes = process.env._EXPO_E2E_USE_TYPED_ROUTES;

const generatedFiles = ['tsconfig.json', 'expo-env.d.ts', '.expo/types/router.d.ts', '.gitignore'];

beforeAll(async () => {
  await fs.promises.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env._EXPO_E2E_USE_TYPED_ROUTES = '1';
});

afterAll(async () => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  process.env._EXPO_E2E_USE_TYPED_ROUTES = originalUseTypedRoutes;

  // Remove the generated files
  await Promise.all(
    generatedFiles.map((file) =>
      fs.promises.rm(path.join(projectRoot, file), { recursive: true, force: true })
    )
  );
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/customize').expoCustomize`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/customize/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo customize --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['customize', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Generate static project files

      Usage
        $ npx expo customize [files...] -- [options]

      Options
        [files...]  List of files to generate
        [options]   Options to pass to the install command
        -h, --help  Usage info
    "
  `);
});

it('runs `npx expo customize`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-customize', 'with-blank', {
    reuseExisting: false,
  });

  // `npx expo customize index.html babel.config.js`
  await executeExpoAsync(projectRoot, ['customize', 'public/index.html', 'babel.config.js']);

  expect(findProjectFiles(projectRoot)).toEqual([
    'App.js',
    'app.json',
    'babel.config.js',
    'bun.lockb',
    'metro.config.js',
    'package.json',
    'public/index.html',
  ]);
});

it('runs `npx expo customize tsconfig.json`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'expo-customize-typescript',
    'with-router',
    {
      reuseExisting: false,
      sdkVersion: '52.0.0',
    }
  );

  // `npx expo customize tsconfig.json`
  await executeExpoAsync(projectRoot, ['customize', 'tsconfig.json']);

  // Expect them to exist with correct access controls
  for (const file of generatedFiles) {
    await expect(
      fs.promises.access(path.join(projectRoot, file), fs.constants.F_OK)
    ).resolves.toBeUndefined();
  }
});

it('runs `npx expo customize tsconfig.json` on a partially setup project', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'expo-customize-typescript-partial',
    'with-router',
    {
      reuseExisting: false,
      sdkVersion: '52.0.0',
    }
  );

  const existingTsConfig = {
    extends: 'custom-package',
    compilerOptions: {
      strict: true,
    },
    customOption: true,
    include: ['custom'],
  };

  // Write a tsconfig with partial data
  await fs.promises.writeFile(
    path.join(projectRoot, 'tsconfig.json'),
    JSON.stringify(existingTsConfig)
  );

  // `npx expo customize tsconfig.json`
  await executeExpoAsync(projectRoot, ['customize', 'tsconfig.json']);

  const newTsconfig = await fs.promises.readFile(path.join(projectRoot, 'tsconfig.json'), 'utf-8');

  expect(JSON.parse(newTsconfig)).toEqual({
    ...existingTsConfig,
    include: ['custom', '.expo/types/**/*.ts', 'expo-env.d.ts'],
  });
});

it('runs `npx expo customize tsconfig.json` sets up typed routes', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'expo-customize-typed-routes',
    'with-router-typed-routes',
    { reuseExisting: false, linkExpoPackages: ['expo-router'] }
  );

  // `npx expo customize tsconfig.json`
  await executeExpoAsync(projectRoot, ['customize', 'tsconfig.json']);

  // Ensure no typescript errors are found
  await executeAsync(projectRoot, ['node', require.resolve('typescript/bin/tsc')]);
});
