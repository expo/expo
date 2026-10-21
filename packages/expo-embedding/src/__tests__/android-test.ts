import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  configureAndroidProject,
  editGradleBlock,
  prepareAndroidProject,
  prepareAndroidWorkspace,
} from '../android';
import { findAppRoot, scaffoldExpoProject } from '../scaffold';
describe('Embedding Expo in Android projects', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-android-test-'));
    mkdirSync(join(root, 'app/src/main'), { recursive: true });
    writeFileSync(
      join(root, 'settings.gradle.kts'),
      'pluginManagement { repositories { google() } }\ninclude(":app")\n'
    );
    writeFileSync(
      join(root, 'build.gradle.kts'),
      'plugins { alias(libs.plugins.android.application) apply false }\n'
    );
    writeFileSync(
      join(root, 'app/build.gradle.kts'),
      'plugins { alias(libs.plugins.android.application) }\nandroid { namespace = "example.app" }\n'
    );
  });
  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });
  function installFixtureDependencies() {
    mkdirSync(join(root, 'expo'), { recursive: true });
    writeFileSync(join(root, 'expo/package.json'), '{}');
    for (const [name, version] of Object.entries({
      expo: '58.0.14',
      react: '19.3.0',
      'react-native': '0.88.0',
      'expo-modules-autolinking': '58.0.0',
      '@react-native/codegen': '0.88.0',
      '@react-native/gradle-plugin': '0.88.0',
      'hermes-compiler': '1.0.0',
    })) {
      const directory = join(root, 'expo/node_modules', name);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version }));
    }
  }
  it('should discover an Android host from a source directory', async () => {
    expect(await findAppRoot(join(root, 'app/src/main'))).toBe(root);
  });
  it('should scaffold Android without an iOS project override or Swift example', async () => {
    await scaffoldExpoProject(root, { expo: '58.0.14' }, 'android');
    expect(readFileSync(join(root, 'expo/react-native.config.js'), 'utf8')).toContain('android');
    expect(readFileSync(join(root, 'expo/react-native.config.js'), 'utf8')).not.toContain(
      'ios: null'
    );
  });
  it('should insert a settings plugins block after pluginManagement', () => {
    const source = 'pluginManagement { repositories { google() } }\nrootProject.name = "Example"\n';
    const updated = editGradleBlock(source, 'plugins', 'id("example")', 'plugins');
    expect(updated.indexOf('plugins {')).toBeGreaterThan(updated.indexOf('google()'));
    expect(updated.indexOf('plugins {')).toBeLessThan(updated.indexOf('rootProject.name'));
    expect(editGradleBlock(updated, 'plugins', 'id("example")', 'plugins')).toBe(updated);
  });
  it('should ignore braces and block names inside strings and comments', () => {
    const source =
      '// plugins { fake }\nplugins {\n id("example") // }\n}\nval text = "plugins { }"\n';
    const result = editGradleBlock(source, 'plugins', 'id("added")', 'plugins');
    expect(result).toContain('id("added")');
    expect(result).toContain('val text = "plugins { }"');
    expect(result.indexOf('id("added")')).toBeLessThan(result.indexOf('id("example")'));
  });
  it('should reject malformed Gradle files before writing the host', async () => {
    const file = join(root, 'settings.gradle.kts');
    writeFileSync(file, 'pluginManagement {');
    await expect(prepareAndroidProject(root)).rejects.toThrow('Unbalanced');
    expect(readFileSync(file, 'utf8')).toBe('pluginManagement {');
  });
  it('should reject an unmanaged React Native integration', async () => {
    const file = join(root, 'app/build.gradle.kts');
    writeFileSync(file, 'plugins { id("com.facebook.react") }');
    await expect(prepareAndroidProject(root)).rejects.toThrow('existing React Native');
  });
  it('should add the Expo workspace without replacing root dependencies or scripts', async () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        private: true,
        scripts: { lint: 'custom-lint' },
        devDependencies: { tool: '1.0.0' },
      })
    );
    await prepareAndroidWorkspace(root, false);
    const first = readFileSync(join(root, 'package.json'), 'utf8');
    expect(JSON.parse(first)).toEqual({
      private: true,
      scripts: { lint: 'custom-lint' },
      devDependencies: { tool: '1.0.0' },
      workspaces: ['expo'],
    });
    await prepareAndroidWorkspace(root, true);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(first);
  });
  it('should reject workspace migration during a frozen install', async () => {
    await expect(prepareAndroidWorkspace(root, true)).rejects.toThrow('frozen');
  });
  it('should reject a shared root dependency tree before changing manifests', async () => {
    symlinkSync(join(root, 'app'), join(root, 'node_modules'));
    await expect(prepareAndroidWorkspace(root, false)).rejects.toThrow('node_modules');
  });
  it('should preserve Expo settings while enabling source builds', async () => {
    mkdirSync(join(root, 'expo'));
    writeFileSync(
      join(root, 'expo/package.json'),
      JSON.stringify({
        expo: { autolinking: { android: { exclude: ['example'] } } },
      })
    );
    await prepareAndroidWorkspace(root, false);
    const manifest = readFileSync(join(root, 'expo/package.json'), 'utf8');
    expect(JSON.parse(manifest).expo.autolinking.android).toEqual({
      exclude: ['example'],
      buildFromSource: ['.*'],
    });
    await prepareAndroidWorkspace(root, true);
    expect(readFileSync(join(root, 'expo/package.json'), 'utf8')).toBe(manifest);
  });
  it('should reject unsupported package managers without rewriting their manifest', async () => {
    const original = JSON.stringify({ packageManager: 'pnpm@12.2.1' });
    writeFileSync(join(root, 'package.json'), original);
    await expect(prepareAndroidWorkspace(root, false)).rejects.toThrow('npm workspace');
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(original);
  });
  it('should preserve host edits and generate identical files on repeated setup', async () => {
    installFixtureDependencies();
    writeFileSync(join(root, 'gradle.properties'), 'custom.host.property=preserved\n');
    const hostDirectory = join(root, '.expo-source/android/host');
    mkdirSync(hostDirectory, { recursive: true });
    const oldApplication = join(hostDirectory, 'ExpoEmbeddingApplication.kt');
    writeFileSync(oldApplication, 'old generated application');
    writeFileSync(join(hostDirectory, 'Other.kt'), 'other host source');
    const oldActivity = join(
      root,
      '.expo-source/android/library/src/main/java/expo/embedding/ExpoActivity.kt'
    );
    mkdirSync(join(oldActivity, '..'), { recursive: true });
    writeFileSync(oldActivity, 'old generated activity');
    const templates = join(__dirname, '../../templates/android');
    await configureAndroidProject(root, templates, process.execPath);
    expect(existsSync(oldApplication)).toBe(false);
    expect(existsSync(oldActivity)).toBe(false);
    expect(existsSync(join(oldActivity, '../ExpoActivityDelegate.kt'))).toBe(true);
    expect(readFileSync(join(root, '.expo-source/android/INTEGRATION.md'), 'utf8')).toContain(
      'AppCompatActivity(), PermissionAwareActivity'
    );
    expect(existsSync(join(hostDirectory, 'ExpoApplicationDelegate.kt'))).toBe(true);
    expect(readFileSync(join(hostDirectory, 'Other.kt'), 'utf8')).toBe('other host source');
    const files = [
      'settings.gradle.kts',
      'build.gradle.kts',
      'app/build.gradle.kts',
      'gradle.properties',
      '.expo-source/android/app.gradle',
      '.expo-source/android/host/ExpoApplicationDelegate.kt',
      '.expo-source/android/library/src/main/java/expo/embedding/ExpoActivityDelegate.kt',
      '.expo-source/android/INTEGRATION.md',
    ];
    const before = files.map((file) => readFileSync(join(root, file), 'utf8'));
    await configureAndroidProject(root, templates, process.execPath);
    expect(files.map((file) => readFileSync(join(root, file), 'utf8'))).toEqual(before);
    expect(before[2]).toContain('namespace = "example.app"');
    expect(before[3]).toContain('custom.host.property=preserved');
    expect(before[3].match(/expo-embedding:android-properties:begin/g)).toHaveLength(1);
    expect(before[4]).toContain('debuggableVariants = []');
  });
  it('should roll back approved host edits when native generation fails', async () => {
    installFixtureDependencies();
    const path = join(root, 'app/src/main/MainActivity.kt');
    const before = 'class MainActivity : ComponentActivity()';
    const after = 'class MainActivity : AppCompatActivity()';
    const application = join(root, 'app/src/main/MainApplication.kt');
    const manifest = join(root, 'app/src/main/AndroidManifest.xml');
    writeFileSync(manifest, '<application />');
    writeFileSync(path, before);
    const settingsBefore = readFileSync(join(root, 'settings.gradle.kts'), 'utf8');
    const write = fs.writeFile;
    jest.spyOn(fs, 'writeFile').mockImplementation(async (file, ...args) => {
      if (file === join(root, 'gradle.properties')) {
        expect(readFileSync(path, 'utf8')).toBe(after);
        expect(existsSync(application)).toBe(true);
        expect(readFileSync(manifest, 'utf8')).toContain('android:name');
        throw new Error('simulated disk failure');
      }
      return write(file, ...args);
    });
    await expect(
      configureAndroidProject(root, join(__dirname, '../../templates/android'), process.execPath, [
        { path, before, after },
        {
          path: application,
          before: undefined,
          after: 'class MainApplication : Application()',
        },
        {
          path: manifest,
          before: '<application />',
          after: '<application android:name="example.MainApplication" />',
        },
      ])
    ).rejects.toThrow('simulated disk failure');
    expect(readFileSync(path, 'utf8')).toBe(before);
    expect(existsSync(application)).toBe(false);
    expect(readFileSync(manifest, 'utf8')).toBe('<application />');
    expect(readFileSync(join(root, 'settings.gradle.kts'), 'utf8')).toBe(settingsBefore);
    expect(existsSync(join(root, '.expo-source/android/INTEGRATION.md'))).toBe(false);
  });
  it('should reject host edits made after approval before generating native files', async () => {
    const path = join(root, 'app/src/main/MainActivity.kt');
    writeFileSync(path, 'edited after preview');
    await expect(
      configureAndroidProject(root, join(__dirname, '../../templates/android'), process.execPath, [
        { path, before: 'original', after: 'migrated' },
      ])
    ).rejects.toThrow('changed after the migration preview');
    expect(readFileSync(path, 'utf8')).toBe('edited after preview');
    expect(existsSync(join(root, '.expo-source'))).toBe(false);
  });
  it('should not overwrite an Application created after the host preview', async () => {
    const path = join(root, 'app/src/main/MainApplication.kt');
    writeFileSync(path, 'created after preview');
    await expect(
      configureAndroidProject(root, join(__dirname, '../../templates/android'), process.execPath, [
        { path, before: undefined, after: 'generated Application' },
      ])
    ).rejects.toThrow('changed after the migration preview');
    expect(readFileSync(path, 'utf8')).toBe('created after preview');
  });
});
