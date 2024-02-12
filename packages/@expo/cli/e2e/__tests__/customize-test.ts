/* eslint-env jest */
import execa from 'execa';
import { constants as fsConstants } from 'fs';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { execute, projectRoot, getLoadedModulesAsync, setupTestProjectAsync, bin } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;
const originalUseTypedRoutes = process.env._EXPO_E2E_USE_TYPED_ROUTES;

const generatedFiles = ['tsconfig.json', 'expo-env.d.ts', '.expo/types/router.d.ts', '.gitignore'];

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
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
  const results = await execute('customize', '--help');
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

it(
  'runs `npx expo customize`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-customize', 'with-blank');
    // `npx expo customize index.html serve.json babel.config.js`
    await execa(
      'node',
      [bin, 'customize', 'public/index.html', 'public/serve.json', 'babel.config.js'],
      {
        cwd: projectRoot,
      }
    );

    const files = klawSync(projectRoot)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(projectRoot, entry.path);
      })
      .filter(Boolean);

    expect(files).toEqual([
      'App.js',
      'app.json',
      'babel.config.js',
      'bun.lockb',
      'package.json',
      'public/index.html',
      'public/serve.json',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo customize tsconfig.json`',
  async () => {
    const projectRoot = await setupTestProjectAsync('expo-typescript', 'with-router', '49.0.0');

    // `npx expo typescript
    await execa('node', [bin, 'customize', 'tsconfig.json'], {
      cwd: projectRoot,
      // env: { NODE_OPTIONS: '--inspect-brk' },
    });

    // Expect them to exist with correct access controls
    for (const file of generatedFiles) {
      await expect(
        fs.promises.access(path.join(projectRoot, file), fsConstants.F_OK)
      ).resolves.toBeUndefined();
    }
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo customize tsconfig.json` on a partially setup project',
  async () => {
    const projectRoot = await setupTestProjectAsync('expo-typescript', 'with-router', '49.0.0');

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

    // `npx expo typescript
    const a = await execa('node', [bin, 'customize', 'tsconfig.json'], {
      cwd: projectRoot,
    });

    const newTsconfig = await fs.promises.readFile(
      path.join(projectRoot, 'tsconfig.json'),
      'utf-8'
    );

    expect(JSON.parse(newTsconfig)).toEqual({
      ...existingTsConfig,
      include: ['custom', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    });
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
