/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs/promises';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  bin,
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
  const modules = await getLoadedModulesAsync(`require('../../build/src/lint').expoLint`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/lint/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo lint --help`', async () => {
  const results = await execute('lint', '--help');
  expect(results.stdout).toMatchSnapshot();
});

it(
  'runs `npx expo lint` to install lint in a project',
  async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync('basic-lint', 'with-blank', {
      reuseExisting: false,
    });
    // `npx expo install expo-sms`
    await execa('node', [bin, 'lint'], { cwd: projectRoot });

    const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Ensure the config was added
    expect(pkg.devDependencies).toHaveProperty('eslint-config-expo');
    // And not in the dependencies
    expect(pkg.dependencies).not.toHaveProperty('eslint-config-expo');

    // Ensure the eslint package was added
    expect(pkg.devDependencies).toHaveProperty('eslint');

    // Check if the helper script was added
    expect(pkg.scripts).toHaveProperty('lint');

    expect(findProjectFiles(projectRoot)).toStrictEqual([
      '.eslintrc.js',
      'App.js',
      'app.json',
      'bun.lockb',
      'metro.config.js',
      'package.json',
    ]);

    await execa('bun', ['run', 'lint', '--max-warnings', '0'], { cwd: projectRoot });
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);

it(
  'runs `npx expo customize .eslintrc.js` to install lint in a project',
  async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync('customize-lint', 'with-blank', {
      reuseExisting: false,
    });
    // `npx expo install expo-sms`
    await execa('node', [bin, 'customize', '.eslintrc.js'], { cwd: projectRoot });

    const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Ensure the config was added
    expect(pkg.devDependencies).toHaveProperty('eslint-config-expo');
    // And not in the dependencies
    expect(pkg.dependencies).not.toHaveProperty('eslint-config-expo');

    // Ensure the eslint package was added
    expect(pkg.devDependencies).toHaveProperty('eslint');

    // Check if the helper script was added
    expect(pkg.scripts).toHaveProperty('lint');

    expect(findProjectFiles(projectRoot)).toStrictEqual([
      '.eslintrc.js',
      'App.js',
      'app.json',
      'bun.lockb',
      'metro.config.js',
      'package.json',
    ]);

    await execa('bun', ['run', 'lint', '--max-warnings', '0'], { cwd: projectRoot });
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);
