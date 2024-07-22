import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import {
  createTestPath,
  ensureFolderExists,
  execute,
  executePassing,
  expectExecutePassing,
  expectFileExists,
  expectFileNotExists,
  forcePackageManagerEnv,
  getTestPath,
  projectRoot,
} from './utils';

beforeAll(async () => {
  ensureFolderExists(projectRoot);
});

it('prevents overwriting directories with projects', async () => {
  const projectName = 'cannot-overwrite-files';

  createTestPath(projectName);
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  fs.writeFileSync(getTestPath(projectName, 'package.json'), '{ "version": "1.0.0" }');

  expect.assertions(1);
  try {
    await execute([projectName]);
  } catch (error: any) {
    expect(error.stdout).toMatch(/has files that might be overwritten/);
  }
});

it('creates a full basic project by default', async () => {
  const projectName = 'defaults-to-basic';
  await executePassing([projectName]);

  expectFileExists(projectName, 'package.json');
  expectFileExists(projectName, 'app/_layout.tsx');
  expectFileExists(projectName, '.gitignore');
  expectFileExists(projectName, 'app.json');
  // expect(fileExists(projectName, 'node_modules')).toBeTruthy();
  expectFileNotExists(projectName, 'ios/');
  expectFileNotExists(projectName, 'android/');

  // Ensure the app.json is written properly
  const appJsonPath = path.join(projectRoot, projectName, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, { encoding: 'utf8' }));
  expect(appJson.expo.name).toBe('defaults-to-basic');
  expect(appJson.expo.slug).toBe('defaults-to-basic');

  // Ensure the package.json is written properly
  const packageJsonPath = path.join(projectRoot, projectName, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
  expect(packageJson.name).toBe('defaults-to-basic');
});

it('throws when fetch is disabled', async () => {
  const projectName = 'throws-when-fetch-disabled';
  let result: Awaited<ReturnType<typeof execute>>;

  try {
    result = await execute([projectName, '--example', 'with-router'], {
      env: { NODE_OPTIONS: '--no-experimental-fetch' },
    });
  } catch (error: any) {
    result = error;
  }

  expect(result).toMatchObject({
    stderr: expect.stringContaining('Node.js built-in fetch is required to continue'),
  });
});

it('uses pnpm', async () => {
  const projectName = 'uses-pnpm';
  const results = await executePassing([projectName, '--no-install'], {
    // Run: DEBUG=create-expo-app:* pnpm create expo-app
    env: forcePackageManagerEnv('pnpm'),
  });

  // Test that the user was warned about deps
  expect(results.stdout).toMatch(/make sure you have modules installed/);
  expect(results.stdout).toMatch(/pnpm install/);

  expectFileExists(projectName, 'package.json');
  expectFileExists(projectName, 'app/_layout.tsx');
  expectFileExists(projectName, '.gitignore');
  // Check if it skipped install
  expectFileNotExists(projectName, 'node_modules');

  // Check if `pnpm` node linker is set
  expectFileExists(projectName, '.npmrc');
  const { stdout } = expectExecutePassing(
    await spawnAsync('pnpm', ['config', 'get', 'node-linker'], { cwd: getTestPath(projectName) })
  );
  expect(stdout).toContain('hoisted');
});

it('uses Bun', async () => {
  const projectName = 'uses-bun';
  const results = await executePassing([projectName, '--no-install'], {
    // Run: DEBUG=create-expo-app:* bunx create-expo-app
    env: forcePackageManagerEnv('bun'),
  });

  // Test that the user was warned about deps
  expect(results.stdout).toMatch(/make sure you have modules installed/);
  expect(results.stdout).toMatch(/bun install/);

  expectFileExists(projectName, 'package.json');
  expectFileExists(projectName, 'app/_layout.tsx');
  expectFileExists(projectName, '.gitignore');
  // Check if it skipped install
  expectFileNotExists(projectName, 'node_modules');
});

it('uses npm', async () => {
  const projectName = 'uses-npm';
  const results = await executePassing([projectName, '--no-install'], {
    // Run: DEBUG=create-expo-app:* npm create expo-app
    env: forcePackageManagerEnv('npm'),
  });

  // Test that the user was warned about deps
  expect(results.stdout).toMatch(/make sure you have modules installed/);
  expect(results.stdout).toMatch(/npm install/);

  expectFileExists(projectName, 'package.json');
  expectFileExists(projectName, 'app/_layout.tsx');
  expectFileExists(projectName, '.gitignore');
  // Check if it skipped install
  expectFileNotExists(projectName, 'node_modules');
});

it('uses yarn', async () => {
  const projectName = 'uses-yarn';
  const results = await executePassing([projectName, '--no-install'], {
    // Run: DEBUG=create-expo-app:* yarn create expo-app
    env: forcePackageManagerEnv('yarn'),
  });

  // Test that the user was warned about deps
  expect(results.stdout).toMatch(/make sure you have modules installed/);
  expect(results.stdout).toMatch(/yarn install/);

  expectFileExists(projectName, 'package.json');
  expectFileExists(projectName, 'app/_layout.tsx');
  expectFileExists(projectName, '.gitignore');
  // Check if it skipped install
  expectFileNotExists(projectName, 'node_modules');
});

describe('yes', () => {
  it('creates a default project in the current directory', async () => {
    const projectName = 'yes-default-directory';

    await executePassing([projectName, '--no-install', '--yes']);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'app/_layout.tsx');
    expectFileExists(projectName, '.gitignore');
    expectFileNotExists(projectName, 'node_modules');
  });

  it('creates a default project in a new directory', async () => {
    const projectName = 'yes-other-directory';

    await executePassing([projectName, '--no-install', '-y']);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'app/_layout.tsx');
    expectFileExists(projectName, '.gitignore');
    expectFileNotExists(projectName, 'node_modules');
  });

  xit('creates a default project in a new directory with a custom template', async () => {
    const projectName = 'yes-custom-template';

    await executePassing([projectName, '--no-install', '--yes', '--template', 'blank']);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'app/_layout.tsx');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');

    // Ensure the app.json is written properly
    const appJsonPath = path.join(projectRoot, projectName, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, { encoding: 'utf8' }));
    expect(appJson.expo.name).toBe('yes-custom-template');
    expect(appJson.expo.slug).toBe('yes-custom-template');

    // Ensure the package.json is written properly
    const packageJsonPath = path.join(projectRoot, projectName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
    expect(packageJson.name).toBe('yes-custom-template');
  });
});

xdescribe('templates', () => {
  it('allows overwriting directories with tolerable files', async () => {
    const projectName = 'can-overwrite';
    const projectRoot = createTestPath(projectName);
    // Create the project root aot
    fs.mkdirSync(projectRoot);
    // Create a fake package.json -- this is a terminal file that cannot be overwritten.
    fs.writeFileSync(path.join(projectRoot, 'LICENSE'), 'hello world');

    executePassing([
      projectName,
      '--no-install',
      '--template',
      'https://github.com/expo/examples/tree/master/blank',
    ]);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'App.js');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');

    // Ensure the app.json is written properly
    const appJsonPath = path.join(projectRoot, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, { encoding: 'utf8' }));
    expect(appJson.expo.name).toBe('can-overwrite');
    expect(appJson.expo.slug).toBe('can-overwrite');

    // Ensure the package.json is written properly
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
    expect(packageJson.name).toBe('can-overwrite');
  });

  it('throws when an invalid template is used', async () => {
    const projectName = 'invalid-template-name';
    expect.assertions(2);
    try {
      await execute([
        projectName,
        '--template',
        'fake template path that is too obviously long to be real',
      ]);
    } catch (error: any) {
      expect(error.stderr).toMatch(/Could not locate the template/i);
    }
    expect(fs.existsSync(getTestPath(projectName, 'package.json'))).toBeFalsy();
  });

  it('downloads a valid template', async () => {
    const projectName = 'valid-template-name';

    await executePassing([projectName, '--template', 'blank']);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'App.js');
    expectFileExists(projectName, 'README.md');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');
  });

  it(`doesn't prompt to install cocoapods in a project without an ios folder`, async () => {
    const projectName = 'no-install-no-pods-no-prompt';
    const results = await executePassing([projectName, '--no-install', '--template', 'blank']);

    // Ensure it doesn't warn to install pods since blank doesn't have an ios folder.
    expect(results.stdout).not.toMatch(/make sure you have CocoaPods installed/);
    expect(results.stdout).not.toMatch(/npx pod-install/);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'App.js');
    expectFileExists(projectName, '.gitignore');
    // Ensure it skipped install
    expectFileNotExists(projectName, 'node_modules');
  });

  it('uses npm', async () => {
    const projectName = 'uses-npm';
    const results = await executePassing([projectName, '--no-install', '--use-npm']);

    // Test that the user was warned about deps
    expect(results.stdout).toMatch(/make sure you have modules installed/);
    expect(results.stdout).toMatch(/npm install/);
    if (process.platform === 'darwin') {
      expect(results.stdout).toMatch(/make sure you have CocoaPods installed/);
      expect(results.stdout).toMatch(/npx pod-install/);
    }

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'app/_layout.tsx');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');
  });

  it('downloads a github repo with sub-project', async () => {
    const projectName = 'full-url';
    const results = await executePassing([
      projectName,
      '--no-install',
      '--template',
      'https://github.com/expo/examples/tree/master/blank',
    ]);

    // Test that the user was warned about deps
    expect(results.stdout).toMatch(/make sure you have modules installed/);
    expect(results.stdout).toMatch(/yarn/);
    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'App.js');
    expectFileExists(projectName, 'README.md');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');
  });

  it('downloads a github repo with the template path option', async () => {
    const projectName = 'partial-url-and-path';

    await executePassing([
      projectName,
      '--no-install',
      '--template',
      'https://github.com/expo/examples/tree/master',
      '--template-path',
      'blank',
    ]);

    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'App.js');
    expectFileExists(projectName, 'README.md');
    expectFileExists(projectName, '.gitignore');
    // Check if it skipped install
    expectFileNotExists(projectName, 'node_modules');
  });
});
