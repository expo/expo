import fs from 'fs';
import path from 'path';

import {
  createTestPath,
  ensureFolderExists,
  executePassing,
  expectFileExists,
  expectFileNotExists,
  getTestPath,
  projectRoot,
  readJson,
} from './utils';

/** Absolute path to the local expo-module-template package */
const localTemplatePath = path.resolve(__dirname, '../../../expo-module-template');

/** Absolute path to the local expo-module-template-local package */
const localTemplateLocalPath = path.resolve(__dirname, '../../../expo-module-template-local');

/**
 * Creates a minimal project directory (with package.json) inside the shared
 * test root and returns its absolute path. Required for --local module tests
 * because create-expo-module walks up from INIT_CWD looking for package.json.
 */
function createFakeProject(projectName: string): string {
  const dir = createTestPath(projectName);
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: projectName, version: '1.0.0' })
  );
  return dir;
}

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
    expect(result.stdout).toMatch(/--platform/);
  });

  it('shows version with --version flag', async () => {
    const result = await executePassing(['--version']);

    // Should output a semver version
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});

describe('--platform option', () => {
  it('creates a module with --platform apple (single platform)', async () => {
    const projectName = 'platform-apple-only';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'PlatformTest',
      '--package',
      'com.test.platform',
      '--platform',
      'apple',
      '--source',
      localTemplatePath,
    ]);

    expectFileExists(projectName, 'expo-module.config.json');
    const moduleConfig = readJson(projectName, 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['apple']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeUndefined();

    // Platform directories should reflect the selected platforms
    expectFileExists(projectName, 'ios');
    expectFileNotExists(projectName, 'android');

    // Web files should exist but contain the "not available" stub
    expectFileExists(projectName, 'src/PlatformTestModule.web.ts');
    expectFileExists(projectName, 'src/PlatformTestView.web.tsx');
    expect(fs.readFileSync(getTestPath(projectName, 'src/PlatformTestModule.web.ts'), 'utf8')).toContain(
      'not available on the web platform'
    );
    expect(fs.readFileSync(getTestPath(projectName, 'src/PlatformTestView.web.tsx'), 'utf8')).toContain(
      'not available on the web platform'
    );
  });

  it('creates a module with --platform apple android (multiple platforms)', async () => {
    const projectName = 'platform-multi';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'MultiPlatform',
      '--package',
      'com.test.multi',
      '--platform',
      'apple',
      'android',
      '--source',
      localTemplatePath,
    ]);

    const moduleConfig = readJson(projectName, 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['apple', 'android']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeDefined();

    // Both platform directories should be present
    expectFileExists(projectName, 'ios');
    expectFileExists(projectName, 'android');

    // Web files should exist but contain the "not available" stub
    expectFileExists(projectName, 'src/MultiPlatformModule.web.ts');
    expectFileExists(projectName, 'src/MultiPlatformView.web.tsx');
    expect(fs.readFileSync(getTestPath(projectName, 'src/MultiPlatformModule.web.ts'), 'utf8')).toContain(
      'not available on the web platform'
    );
    expect(fs.readFileSync(getTestPath(projectName, 'src/MultiPlatformView.web.tsx'), 'utf8')).toContain(
      'not available on the web platform'
    );
  });

  it('defaults to all platforms when --platform is not provided', async () => {
    const projectName = 'platform-default';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'DefaultPlatform',
      '--package',
      'com.test.default',
      '--source',
      localTemplatePath,
    ]);

    const moduleConfig = readJson(projectName, 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['apple', 'android', 'web']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeDefined();

    // Both platform directories should be present
    expectFileExists(projectName, 'ios');
    expectFileExists(projectName, 'android');

    // Web files should exist with the full implementation
    expectFileExists(projectName, 'src/DefaultPlatformModule.web.ts');
    expectFileExists(projectName, 'src/DefaultPlatformView.web.tsx');
    expect(fs.readFileSync(getTestPath(projectName, 'src/DefaultPlatformModule.web.ts'), 'utf8')).not.toContain(
      'not available on the web platform'
    );
    expect(fs.readFileSync(getTestPath(projectName, 'src/DefaultPlatformView.web.tsx'), 'utf8')).not.toContain(
      'not available on the web platform'
    );
  });

  it('creates a web-only module with no apple/android sections', async () => {
    const projectName = 'platform-web-only';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'WebOnly',
      '--package',
      'com.test.webonly',
      '--platform',
      'web',
      '--source',
      localTemplatePath,
    ]);

    const moduleConfig = readJson(projectName, 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['web']);
    expect(moduleConfig.apple).toBeUndefined();
    expect(moduleConfig.android).toBeUndefined();

    // Neither platform directory should be present
    expectFileNotExists(projectName, 'ios');
    expectFileNotExists(projectName, 'android');

    // Web files should exist with the full implementation
    expectFileExists(projectName, 'src/WebOnlyModule.web.ts');
    expectFileExists(projectName, 'src/WebOnlyView.web.tsx');
    expect(fs.readFileSync(getTestPath(projectName, 'src/WebOnlyModule.web.ts'), 'utf8')).not.toContain(
      'not available on the web platform'
    );
    expect(fs.readFileSync(getTestPath(projectName, 'src/WebOnlyView.web.tsx'), 'utf8')).not.toContain(
      'not available on the web platform'
    );
  });

  it('creates an android-only module', async () => {
    const projectName = 'platform-android-only';

    await executePassing([
      projectName,
      '--no-example',
      '--name',
      'AndroidOnly',
      '--package',
      'com.test.androidonly',
      '--platform',
      'android',
      '--source',
      localTemplatePath,
    ]);

    const moduleConfig = readJson(projectName, 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['android']);
    expect(moduleConfig.android).toBeDefined();
    expect(moduleConfig.apple).toBeUndefined();

    // android/ should exist, ios/ should not
    expectFileExists(projectName, 'android');
    expectFileNotExists(projectName, 'ios');

    // Web files should exist but contain the "not available" stub
    expectFileExists(projectName, 'src/AndroidOnlyModule.web.ts');
    expectFileExists(projectName, 'src/AndroidOnlyView.web.tsx');
    expect(fs.readFileSync(getTestPath(projectName, 'src/AndroidOnlyModule.web.ts'), 'utf8')).toContain(
      'not available on the web platform'
    );
    expect(fs.readFileSync(getTestPath(projectName, 'src/AndroidOnlyView.web.tsx'), 'utf8')).toContain(
      'not available on the web platform'
    );
  });

  it('warns and defaults to all platforms when only invalid values are given', async () => {
    const fakeProject = createFakeProject('local-invalid-only');

    // "ios" is not a valid platform value (the correct value is "apple")
    const result = await executePassing(
      ['my-module', '--local', '--platform', 'ios', '--source', localTemplateLocalPath],
      { cwd: fakeProject }
    );

    // Should warn about the unknown platform and the fallback
    expect(result.stderr).toMatch(/ios/);
    expect(result.stderr).toMatch(/Defaulting to all platforms/i);

    // Should have fallen back to all platforms
    const moduleConfig = readJson('local-invalid-only/modules/my-module', 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['apple', 'android', 'web']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeDefined();
  });

  it('warns about and ignores invalid values when mixed with valid ones', async () => {
    const fakeProject = createFakeProject('local-mixed-invalid');

    // "ios" is invalid; "apple" is the correct value — only apple should be used
    const result = await executePassing(
      ['my-module', '--local', '--platform', 'apple', 'ios', '--source', localTemplateLocalPath],
      { cwd: fakeProject }
    );

    // Should warn about the unknown platform "ios"
    expect(result.stderr).toMatch(/ios/);

    // Should have used only the valid platform
    const moduleConfig = readJson('local-mixed-invalid/modules/my-module', 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['apple']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeUndefined();
  });

  it('creates a local module with --platform respecting the selected platforms', async () => {
    const fakeProject = createFakeProject('local-platform-project');

    await executePassing(
      ['my-module', '--local', '--platform', 'android', '--source', localTemplateLocalPath],
      { cwd: fakeProject }
    );

    const moduleConfig = readJson('local-platform-project/modules/my-module', 'expo-module.config.json');
    expect(moduleConfig.platforms).toEqual(['android']);
    expect(moduleConfig.android).toBeDefined();
    expect(moduleConfig.apple).toBeUndefined();

    // android/ should exist, ios/ should not
    expectFileExists('local-platform-project/modules/my-module', 'android');
    expectFileNotExists('local-platform-project/modules/my-module', 'ios');

    // Web stub should be present
    expect(
      fs.readFileSync(
        getTestPath('local-platform-project/modules/my-module', 'src/MyModule.web.ts'),
        'utf8'
      )
    ).toContain('not available on the web platform');
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
