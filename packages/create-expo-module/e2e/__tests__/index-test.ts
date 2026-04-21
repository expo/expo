import fs from 'fs';
import path from 'path';

import {
  createFakeProject,
  createTestPath,
  ensureFolderExists,
  executePassing,
  expectFileExists,
  expectFileNotExists,
  getTemporaryPath,
  getTestPath,
  projectRoot,
  readJson,
} from './utils';

/** Absolute path to the local expo-module-template package */
const localTemplatePath = path.resolve(__dirname, '../../../expo-module-template');

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
    expect(result.stdout).toMatch(/--barrel/);
    expect(result.stdout).toMatch(/--platform/);
    expect(result.stdout).toMatch(/--package-manager/);
    expect(result.stdout).toMatch(/--license/);
    expect(result.stdout).toMatch(/--module-version/);
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

    // Web module stub should exist (View is opt-in, so no View web file expected)
    expectFileExists(projectName, 'src/PlatformTestModule.web.ts');
    expect(
      fs.readFileSync(getTestPath(projectName, 'src/PlatformTestModule.web.ts'), 'utf8')
    ).toContain('not available on the web platform');
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

    // Web module stub should exist (View is opt-in, so no View web file expected)
    expectFileExists(projectName, 'src/MultiPlatformModule.web.ts');
    expect(
      fs.readFileSync(getTestPath(projectName, 'src/MultiPlatformModule.web.ts'), 'utf8')
    ).toContain('not available on the web platform');
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

    // Web module file should exist with the full implementation (View is opt-in, so no View web file expected)
    expectFileExists(projectName, 'src/DefaultPlatformModule.web.ts');
    expect(
      fs.readFileSync(getTestPath(projectName, 'src/DefaultPlatformModule.web.ts'), 'utf8')
    ).not.toContain('not available on the web platform');
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

    // Web module file should exist with the full implementation (View is opt-in, so no View web file expected)
    expectFileExists(projectName, 'src/WebOnlyModule.web.ts');
    expect(
      fs.readFileSync(getTestPath(projectName, 'src/WebOnlyModule.web.ts'), 'utf8')
    ).not.toContain('not available on the web platform');
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

    // Web module stub should exist (View is opt-in, so no View web file expected)
    expectFileExists(projectName, 'src/AndroidOnlyModule.web.ts');
    expect(
      fs.readFileSync(getTestPath(projectName, 'src/AndroidOnlyModule.web.ts'), 'utf8')
    ).toContain('not available on the web platform');
  });

  it('warns and defaults to all platforms when only invalid values are given', async () => {
    const fakeProject = createFakeProject('local-invalid-only');

    // "ios" is not a valid platform value (the correct value is "apple")
    const result = await executePassing(
      ['my-module', '--local', '--platform', 'ios', '--source', localTemplatePath],
      { cwd: fakeProject }
    );

    // Should warn about the unknown platform and the fallback
    expect(result.stderr).toMatch(/ios/);
    expect(result.stderr).toMatch(/Defaulting to all platforms/i);

    // Should have fallen back to all platforms
    const moduleConfig = readJson(
      'local-invalid-only/modules/my-module',
      'expo-module.config.json'
    );
    expect(moduleConfig.platforms).toEqual(['apple', 'android', 'web']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeDefined();
  });

  it('warns about and ignores invalid values when mixed with valid ones', async () => {
    const fakeProject = createFakeProject('local-mixed-invalid');

    // "ios" is invalid; "apple" is the correct value — only apple should be used
    const result = await executePassing(
      ['my-module', '--local', '--platform', 'apple', 'ios', '--source', localTemplatePath],
      { cwd: fakeProject }
    );

    // Should warn about the unknown platform "ios"
    expect(result.stderr).toMatch(/ios/);

    // Should have used only the valid platform
    const moduleConfig = readJson(
      'local-mixed-invalid/modules/my-module',
      'expo-module.config.json'
    );
    expect(moduleConfig.platforms).toEqual(['apple']);
    expect(moduleConfig.apple).toBeDefined();
    expect(moduleConfig.android).toBeUndefined();
  });

  it('creates a local module with --platform respecting the selected platforms', async () => {
    const fakeProject = createFakeProject('local-platform-project');

    await executePassing(
      ['my-module', '--local', '--platform', 'android', '--source', localTemplatePath],
      { cwd: fakeProject }
    );

    const moduleConfig = readJson(
      'local-platform-project/modules/my-module',
      'expo-module.config.json'
    );
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

describe('--barrel option', () => {
  let localProjectRoot: string;

  beforeAll(() => {
    localProjectRoot = getTemporaryPath();
    fs.mkdirSync(localProjectRoot, { recursive: true });
    // Minimal package.json so the CLI can locate the project root when walking upward
    fs.writeFileSync(
      path.join(localProjectRoot, 'package.json'),
      JSON.stringify({ name: 'test-app', version: '1.0.0' })
    );
  });

  afterAll(async () => {
    if (fs.existsSync(localProjectRoot)) {
      await fs.promises.rm(localProjectRoot, { recursive: true, force: true });
    }
  });

  it('does not generate index.ts barrel file by default', async () => {
    const slug = 'no-barrel-module';

    await executePassing([slug, '--local', '--source', localTemplatePath], {
      cwd: localProjectRoot,
    });

    const indexPath = path.join(localProjectRoot, 'modules', slug, 'index.ts');
    expect({ [indexPath]: fs.existsSync(indexPath) }).toEqual({ [indexPath]: false });
  });

  it('generates index.ts barrel file with correct re-exports when --barrel is set', async () => {
    const slug = 'barrel-module';

    await executePassing(
      [slug, '--local', '--barrel', '--features', 'View', '--source', localTemplatePath],
      { cwd: localProjectRoot }
    );

    const indexPath = path.join(localProjectRoot, 'modules', slug, 'index.ts');
    expect({ [indexPath]: fs.existsSync(indexPath) }).toEqual({ [indexPath]: true });

    const content = fs.readFileSync(indexPath, 'utf8');
    // Re-exports the native module as default
    expect(content).toMatch(/export \{ default \} from '\.\/src\//);
    // Re-exports the view with its name
    expect(content).toMatch(/export \{ default as \w+View \} from '\.\/src\//);
    // Re-exports all types
    expect(content).toMatch(/export \* from '\.\/src\//);
  });

  it('shows a single barrel-style import path in success output when --barrel is set', async () => {
    const slug = 'barrel-message-module';

    const result = await executePassing(
      [slug, '--local', '--barrel', '--source', localTemplatePath],
      { cwd: localProjectRoot }
    );

    // The success message should point to the module root (no /src/ sub-path)
    expect(result.stdout).toMatch(new RegExp(`from './modules/${slug}'`));
    expect(result.stdout).not.toMatch(new RegExp(`from './modules/${slug}/src/`));
  });

  it('shows direct src/ import paths in success output without --barrel', async () => {
    const slug = 'no-barrel-message-module';

    const result = await executePassing([slug, '--local', '--source', localTemplatePath], {
      cwd: localProjectRoot,
    });

    // The success message should include a direct src/ path
    expect(result.stdout).toMatch(new RegExp(`from './modules/${slug}/src/`));
  });
});

describe('CI mode detection', () => {
  let ciProjectRoot: string;

  beforeAll(() => {
    ciProjectRoot = createFakeProject();
  });

  afterAll(async () => {
    if (fs.existsSync(ciProjectRoot)) {
      await fs.promises.rm(ciProjectRoot, { recursive: true, force: true });
    }
  });

  it('completes non-interactively with CI=1', async () => {
    const result = await executePassing(
      ['detect-ci-one', '--local', '--source', localTemplatePath],
      {
        cwd: ciProjectRoot,
        env: { CI: '1' },
      }
    );
    expect(result.stdout).toMatch(/Successfully created/);
  });

  it('completes non-interactively with CI=true', async () => {
    const result = await executePassing(
      ['detect-ci-true', '--local', '--source', localTemplatePath],
      { cwd: ciProjectRoot, env: { CI: 'true' } }
    );
    expect(result.stdout).toMatch(/Successfully created/);
  });

  it('completes non-interactively with CI=TRUE (case-insensitive)', async () => {
    const result = await executePassing(
      ['detect-ci-true-upper', '--local', '--source', localTemplatePath],
      { cwd: ciProjectRoot, env: { CI: 'TRUE' } }
    );
    expect(result.stdout).toMatch(/Successfully created/);
  });

  it('completes non-interactively when EXPO_NONINTERACTIVE=1 and CI is not set', async () => {
    const result = await executePassing(
      ['detect-expo-noninteractive', '--local', '--source', localTemplatePath],
      { cwd: ciProjectRoot, env: { CI: '0', EXPO_NONINTERACTIVE: '1' } }
    );
    expect(result.stdout).toMatch(/Successfully created/);
  });

  it('completes non-interactively via non-TTY stdin when neither CI nor EXPO_NONINTERACTIVE is set', async () => {
    // CI=0 and EXPO_NONINTERACTIVE unset — spawned processes always have non-TTY stdin,
    // so isInteractive() falls through to the isTTY check and returns false
    const result = await executePassing(
      ['detect-non-tty', '--local', '--source', localTemplatePath],
      { cwd: ciProjectRoot, env: { CI: '0' } }
    );
    expect(result.stdout).toMatch(/Successfully created/);
  });
});

describe('non-interactive defaults warning', () => {
  it('warns about defaulted fields when none are explicitly provided', async () => {
    const projectName = 'defaults-warning-module';

    const result = await executePassing([
      projectName,
      '--no-example',
      '--source',
      localTemplatePath,
    ]);

    // Warning should appear on stderr
    expect(result.stderr).toMatch(/The following fields were not explicitly provided/);
    // All non-explicitly-provided fields are listed — hardcoded defaults and auto-derived values
    expect(result.stderr).toMatch(/\bname\b/);
    expect(result.stderr).toMatch(/\bpackage\b/);
    expect(result.stderr).toMatch(/\bdescription\b/);
    expect(result.stderr).toMatch(/\blicense\b/);
    expect(result.stderr).toMatch(/\bversion\b/);
    expect(result.stderr).toMatch(/\bauthorName\b/);
    expect(result.stderr).toMatch(/\bauthorEmail\b/);
    expect(result.stderr).toMatch(/\bauthorUrl\b/);
    expect(result.stderr).toMatch(/\brepo\b/);
  });

  it('omits fields from the warning when they are explicitly provided', async () => {
    const projectName = 'partial-defaults-warning';

    const result = await executePassing([
      projectName,
      '--no-example',
      '--name', 'PartialDefaults',
      '--description', 'Provided description',
      '--package', 'com.test.partial',
      '--author-name', 'Test Author',
      '--author-email', 'test@example.com',
      '--author-url', 'https://github.com/test',
      '--repo', 'https://github.com/test/partial',
      '--license', 'Apache-2.0',
      '--module-version', '1.0.0',
      '--source',
      localTemplatePath,
    ]);

    // All fields were explicitly provided — no warning
    expect(result.stderr).not.toMatch(/The following fields were not explicitly provided/);
  });

  it('respects --license and --module-version in the generated package.json', async () => {
    const projectName = 'custom-license-version';

    await executePassing([
      projectName,
      '--no-example',
      '--name', 'CustomLicenseVersion',
      '--package', 'com.test.custom',
      '--license', 'Apache-2.0',
      '--module-version', '2.0.0',
      '--source',
      localTemplatePath,
    ]);

    const packageJson = readJson(projectName, 'package.json');
    expect(packageJson.license).toBe('Apache-2.0');
    expect(packageJson.version).toBe('2.0.0');
  });
});
