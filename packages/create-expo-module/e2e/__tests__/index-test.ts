import fs from 'fs';

import {
  createTestPath,
  ensureFolderExists,
  executePassing,
  expectFileExists,
  getTestPath,
  projectRoot,
  readJson,
} from './utils';

beforeAll(async () => {
  ensureFolderExists(projectRoot);
});

afterAll(async () => {
  // Clean up the entire test directory
  if (fs.existsSync(projectRoot)) {
    await fs.promises.rm(projectRoot, { recursive: true, force: true });
  }
});

describe('CLI flags', () => {
  it('shows help with --help flag', async () => {
    const result = await executePassing(['--help']);

    expect(result.stdout).toMatch(/create-expo-module/i);
    expect(result.stdout).toMatch(/--name/);
    expect(result.stdout).toMatch(/--description/);
    expect(result.stdout).toMatch(/--package/);
    expect(result.stdout).toMatch(/--author-name/);
  });

  it('shows version with --version flag', async () => {
    const result = await executePassing(['--version']);

    // Should output a semver version
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});

describe('non-interactive module creation', () => {
  it('creates a module with CLI options in CI mode', async () => {
    const projectName = 'ci-module';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'TestModule',
      '--description',
      'A test module',
      '--package',
      'com.test.module',
      '--author-name',
      'Test Author',
      '--author-email',
      'test@example.com',
      '--author-url',
      'https://github.com/test',
      '--repo',
      'https://github.com/test/ci-module',
    ]);

    // Check essential files exist
    expectFileExists(projectName, 'package.json');
    expectFileExists(projectName, 'src/index.ts');
    expectFileExists(projectName, 'android');
    expectFileExists(projectName, 'ios');

    // Verify package.json content
    const packageJson = readJson(projectName, 'package.json');
    expect(packageJson.name).toBe('ci-module');
    expect(packageJson.version).toBe('0.1.0');
    expect(packageJson.description).toBe('A test module');
    expect(packageJson.author).toBe('Test Author <test@example.com> (https://github.com/test)');
    expect(packageJson.repository).toBe('https://github.com/test/ci-module');

    // Verify Android package structure
    expectFileExists(projectName, 'android/src/main/java/com/test/module');

    // The module should be built (TypeScript compiled)
    expectFileExists(projectName, 'build');
  });

  it('warns when target directory is not empty but continues', async () => {
    const projectName = 'non-empty-dir';

    // Create directory with existing file
    createTestPath(projectName);
    fs.writeFileSync(getTestPath(projectName, 'existing-file.txt'), 'existing content');

    const result = await executePassing([
      projectName,
      '--no-example',
      '--name',
      'NonEmpty',
      '--package',
      'com.test.nonempty',
    ]);

    // Should warn about non-empty directory
    expect(result.stdout).toMatch(/not empty/i);

    // Should still create the module
    expectFileExists(projectName, 'package.json');
  });
});
