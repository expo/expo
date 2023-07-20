/* eslint-env jest */
import execa from 'execa';
import { constants as fsConstants } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { bin, execute, getLoadedModulesAsync, projectRoot, setupTestProjectAsync } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env._EXPO_E2E_USE_TYPED_ROUTES = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env._EXPO_E2E_USE_TYPED_ROUTES;
});

it.only('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(
    `require('../../build/src/typescript/index').expoTypescript`
  );
  expect(modules).toStrictEqual([
    '../node_modules/ansi-styles/index.js',
    '../node_modules/arg/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/export/web/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo typescript --help`', async () => {
  const results = await execute('typescript', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Automatically setup Typescript and generate types for Expo packages

      Usage
        $ npx expo typescript

      Options
        -h, --help               Usage info
    "
  `);
});

it(
  'runs `npx expo typescript`',
  async () => {
    const projectRoot = await setupTestProjectAsync('expo-typescript', 'with-router', '48.0.0');

    const generatedFiles = [
      'tsconfig.json',
      'expo-env.d.ts',
      '.expo/types/router.d.ts',
      '.gitignore',
    ];

    // Remove the generated files if they exist (when testing locally the folder may be cached)
    await Promise.all(
      generatedFiles.map((file) =>
        fs.rm(path.join(projectRoot, file), { recursive: true, force: true })
      )
    );

    // `npx expo typescript
    await execa('node', [bin, 'typescript'], {
      cwd: projectRoot,
    });

    // Expect them to exist with correct access controls
    for (const file of generatedFiles) {
      await expect(
        fs.access(path.join(projectRoot, file), fsConstants.F_OK)
      ).resolves.toBeUndefined();
    }
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
