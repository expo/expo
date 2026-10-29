import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const packageRoot = resolve(__dirname, '../..');
let directory: string;
let host: string;
let cli: string;

async function run(...args: string[]) {
  return exec(process.execPath, [cli, ...args], { cwd: host, env: { ...process.env, CI: '1' } });
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'expo-embedding-cli-'));
  await exec(process.execPath, ['scripts/build.cjs'], { cwd: packageRoot });
  const { stdout } = await exec(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
    { cwd: packageRoot, env: { ...process.env, npm_config_cache: join(directory, 'cache') } }
  );
  await exec('tar', ['-xzf', join(directory, JSON.parse(stdout)[0].filename), '-C', directory]);
  cli = join(directory, 'package/bin/expo-embedding.js');
}, 30000);

beforeEach(async () => {
  host = await realpath(await mkdtemp(join(directory, 'host-')));
});

afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('Running the packed CLI outside the Expo checkout', () => {
  it('should show package runner commands before the local Node fallback', async () => {
    const { stdout } = await run('--help');
    expect(stdout).toContain('npx expo-embedding init');
    expect(stdout).not.toContain('skill');
    expect(stdout).not.toContain('--json');
    expect(stdout).toContain('bunx expo-embedding');
    expect(stdout.indexOf('bunx expo-embedding')).toBeLessThan(stdout.indexOf('node /path/'));
    expect(await readdir(host)).toEqual([]);
  });

  it.each(['--version', '-v'])(
    'should print the packaged version with %s outside a host project',
    async (flag) => {
      const manifest = JSON.parse(await readFile(join(directory, 'package/package.json'), 'utf8'));
      const { stdout, stderr } = await run(flag);
      expect(stdout).toBe(`${manifest.version}\n`);
      expect(stderr).toBe('');
      expect(await readdir(host)).toEqual([]);
    }
  );

  it('should reject the removed skill command before changing files', async () => {
    await expect(run('skill')).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Expected init or install <package...>.'),
    });
    expect(await readdir(host)).toEqual([]);
  });

  it('should preview a Compose host migration in CI without installing or applying it', async () => {
    const fixture: Record<string, string> = {
      'settings.gradle.kts': 'pluginManagement { repositories { google() } }\ninclude(":app")\n',
      'build.gradle.kts': 'plugins {}\n',
      'app/build.gradle.kts': 'plugins {}\nandroid { namespace = "example" }\n',
      'app/src/main/java/example/MainActivity.kt':
        'package example\nimport androidx.activity.ComponentActivity\nclass MainActivity : ComponentActivity() {}\n',
      'app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:theme="@style/Theme.Host">
    <activity android:name=".MainActivity"><intent-filter>
      <action android:name="android.intent.action.MAIN" />
      <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter></activity>
  </application>
</manifest>`,
      'app/src/main/res/values/themes.xml':
        '<resources><style name="Theme.Host" parent="android:Theme.Material.Light.NoActionBar" /></resources>',
    };
    for (const [path, content] of Object.entries(fixture)) {
      await mkdir(join(host, path, '..'), { recursive: true });
      await writeFile(join(host, path), content);
    }
    const report = JSON.parse((await run('skill', '--json')).stdout);
    expect(report).toMatchObject({
      platform: 'android',
      selection: { activity: 'example.MainActivity' },
    });
    expect(report.guide).toContain('PermissionAwareActivity');
    expect(report.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'app/src/main/java/example/MainApplication.kt',
          after: expect.stringContaining('ReactApplication by expo'),
        }),
        expect.objectContaining({
          path: 'app/src/main/java/example/MainActivity.kt',
          after: expect.stringContaining('AppCompatActivity'),
        }),
        expect.objectContaining({
          path: 'app/src/main/AndroidManifest.xml',
          after: expect.stringContaining('android:name="example.MainApplication"'),
        }),
        expect.objectContaining({
          path: 'app/src/main/res/values/themes.xml',
          after: expect.stringContaining('Theme.AppCompat'),
        }),
      ])
    );
    expect(await contents(host)).toEqual(fixture);
    await expect(run('init')).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('--configure-host'),
      stdout: expect.stringContaining(report.preview),
    });
    expect(await contents(host)).toEqual(fixture);
  });
});
