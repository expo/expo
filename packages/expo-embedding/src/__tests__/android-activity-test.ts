import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { approveActivityMigration, planActivityMigration } from '../android-activity';
describe('Migrating the Android host Activity', () => {
  let root: string;
  const source = 'app/src/main/java/example/MainActivity.kt';
  const theme = 'app/src/main/res/values/themes.xml';
  const manifest = 'app/src/main/AndroidManifest.xml';
  function write(path: string, contents: string) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  const read = (path: string) => readFileSync(join(root, path), 'utf8');
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-activity-migration-'));
    write('app/build.gradle.kts', 'android { namespace = "example" }');
    write(
      manifest,
      `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:theme="@style/Theme.Example">
    <activity android:name=".MainActivity">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>`
    );
    write(
      source,
      `package example
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
// Keep ComponentActivity in this comment.
class MainActivity : ComponentActivity() {
  val label = "ComponentActivity()"
  fun content() { setContent { ExistingTheme { Greeting() } } }
}`
    );
    write(
      theme,
      `<resources>
  <style name="Theme.Example" parent="android:Theme.Material.Light.NoActionBar">
    <item name="android:statusBarColor">@color/brand</item>
  </style>
</resources>`
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('should preview the exact host edits without writing any files', async () => {
    const before = read(source);
    const plan = await planActivityMigration(root);
    expect(plan.activityName).toBe('example.MainActivity');
    expect(plan.changes.map((change) => change.path)).toEqual([
      join(root, source),
      join(root, theme),
    ]);
    expect(read(source)).toBe(before);
    expect(plan.changes[0].after).toContain('class MainActivity : AppCompatActivity()');
    expect(plan.changes[0].after).toContain('import androidx.appcompat.app.AppCompatActivity');
    expect(plan.changes[0].after).toContain('// Keep ComponentActivity in this comment.');
    expect(plan.changes[0].after).toContain('val label = "ComponentActivity()"');
    expect(plan.changes[0].after).toContain('ExistingTheme { Greeting() }');
    expect(plan.changes[1].after).toContain('parent="Theme.AppCompat.Light.NoActionBar"');
    expect(plan.changes[1].after).toContain(
      '<item name="android:statusBarColor">@color/brand</item>'
    );
  });
  it('should preserve a compatible host and produce no edits on repeated migration', async () => {
    const plan = await planActivityMigration(root);
    for (const change of plan.changes) writeFileSync(change.path, change.after);
    expect((await planActivityMigration(root)).changes).toEqual([]);
  });
  it('should handle an Activity-specific theme and all its resource variants', async () => {
    write(
      manifest,
      read(manifest).replace(
        'android:name=".MainActivity"',
        'android:name="example.MainActivity" android:theme="@style/Theme.Activity"'
      )
    );
    write(theme, read(theme).replace('Theme.Example', 'Theme.Activity'));
    write(
      'app/src/main/res/values-night/themes.xml',
      '<resources><style name="Theme.Activity" parent="android:Theme.Material.NoActionBar" /></resources>'
    );
    expect((await planActivityMigration(root)).changes).toHaveLength(3);
    expect((await planActivityMigration(root)).changes[2].after).toContain(
      'Theme.AppCompat.NoActionBar'
    );
  });
  it('should preserve an existing compatible XML theme', async () => {
    write(
      theme,
      read(theme).replace(
        'android:Theme.Material.Light.NoActionBar',
        'Theme.MaterialComponents.DayNight.NoActionBar'
      )
    );
    expect((await planActivityMigration(root)).changes).toHaveLength(1);
  });
  it('should preserve trailing import comments when changing the superclass import', async () => {
    write(
      source,
      read(source).replace(
        'import androidx.activity.ComponentActivity',
        'import androidx.activity.ComponentActivity // host lifecycle'
      )
    );
    expect((await planActivityMigration(root)).changes[0].after).toContain(
      'import androidx.appcompat.app.AppCompatActivity // host lifecycle'
    );
  });
  it('should preserve ComponentActivity imports used by other declarations', async () => {
    write(
      source,
      read(source) + '\nfun inspect(activity: ComponentActivity) = activity.lifecycle\n'
    );
    const after = (await planActivityMigration(root)).changes[0].after;
    expect(after).toContain('import androidx.activity.ComponentActivity');
    expect(after).toContain('import androidx.appcompat.app.AppCompatActivity');
    expect(after).toContain('fun inspect(activity: ComponentActivity)');
  });
  it('should support a fully qualified superclass without rewriting other imports', async () => {
    write(
      source,
      read(source).replace(' : ComponentActivity()', ' : androidx.activity.ComponentActivity()')
    );
    expect((await planActivityMigration(root)).changes[0].after).toContain(
      ' : androidx.appcompat.app.AppCompatActivity()'
    );
  });
  it('should avoid an existing AppCompatActivity import alias', async () => {
    write(
      source,
      read(source).replace(
        'import androidx.activity.ComponentActivity',
        'import example.Widget as AppCompatActivity\nimport androidx.activity.ComponentActivity'
      )
    );
    const after = (await planActivityMigration(root)).changes[0].after;
    expect(after).toContain('class MainActivity : androidx.appcompat.app.AppCompatActivity()');
    expect(after).toContain('import example.Widget as AppCompatActivity');
    expect(after).not.toContain('import androidx.appcompat.app.AppCompatActivity');
  });
  it('should reject unknown migration targets even for a compatible host', async () => {
    await expect(
      approveActivityMigration(await planActivityMigration(root), {
        migrate: 'component',
        interactive: false,
        confirm: jest.fn(),
      })
    ).rejects.toThrow('Unsupported Activity migration');
  });
  it('should recognize a local custom superclass that already derives from AppCompatActivity', async () => {
    write(source, read(source).replace('ComponentActivity()', 'BaseActivity()'));
    write(
      'app/src/main/java/example/BaseActivity.kt',
      'package example\nimport androidx.appcompat.app.AppCompatActivity\nopen class BaseActivity : AppCompatActivity()'
    );
    expect((await planActivityMigration(root)).changes).toEqual([]);
  });
  it('should reject an unknown superclass without changing the app', async () => {
    write(source, read(source).replace('ComponentActivity()', 'CompanyActivity()'));
    const before = read(source);
    await expect(planActivityMigration(root)).rejects.toThrow('CompanyActivity');
    expect(read(source)).toBe(before);
  });
  it('should reject a custom base requiring migration instead of replacing it', async () => {
    write(source, read(source).replace('ComponentActivity()', 'BaseActivity()'));
    write(
      'app/src/main/java/example/BaseActivity.kt',
      'package example\nimport androidx.activity.ComponentActivity\nopen class BaseActivity : ComponentActivity()'
    );
    await expect(planActivityMigration(root)).rejects.toThrow('custom superclass');
  });
  it('should reject ambiguous launchers', async () => {
    write(
      manifest,
      read(manifest).replace(
        '</application>',
        read(manifest).match(/<activity[\s\S]*<\/activity>/)![0] + '</application>'
      )
    );
    await expect(planActivityMigration(root)).rejects.toThrow('one launcher');
  });
  it('should reject source-set overrides instead of guessing a build variant', async () => {
    write('app/src/debug/AndroidManifest.xml', '<manifest />');
    await expect(planActivityMigration(root)).rejects.toThrow('source set');
  });
  it('should reject a custom XML parent rather than dropping inherited theme attributes', async () => {
    write(theme, read(theme).replace('android:Theme.Material.Light.NoActionBar', 'CompanyTheme'));
    await expect(planActivityMigration(root)).rejects.toThrow('CompanyTheme');
  });
  it('should reject dynamic Activity themes', async () => {
    write(
      source,
      read(source).replace(
        'fun content()',
        'fun theme() { setTheme(R.style.Other) }\n  fun content()'
      )
    );
    await expect(planActivityMigration(root)).rejects.toThrow('setTheme');
  });
  it('should ignore namespace-looking strings and comments in Gradle', async () => {
    write(
      'app/build.gradle.kts',
      'val example = "namespace = \'wrong.app\'"\n// namespace = "also.wrong"\nandroid { namespace = "example" }'
    );
    expect((await planActivityMigration(root)).activityName).toBe('example.MainActivity');
  });
  it('should accept an explicit migration flag without prompting in CI', async () => {
    const confirm = jest.fn();
    await approveActivityMigration(await planActivityMigration(root), {
      migrate: 'appcompat',
      ci: '1',
      interactive: false,
      confirm,
    });
    expect(confirm).not.toHaveBeenCalled();
  });
  it('should reject an incompatible host in CI without treating CI as consent', async () => {
    const confirm = jest.fn();
    await expect(
      approveActivityMigration(await planActivityMigration(root), {
        ci: '1',
        interactive: true,
        confirm,
      })
    ).rejects.toThrow('--migrate-activity=appcompat');
    expect(confirm).not.toHaveBeenCalled();
  });
  it('should ask an interactive user and stop when migration is declined', async () => {
    const plan = await planActivityMigration(root);
    const confirm = jest.fn().mockResolvedValue(false);
    await expect(approveActivityMigration(plan, { interactive: true, confirm })).rejects.toThrow(
      'declined'
    );
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(read(source)).toBe(plan.changes[0].before);
  });
  it('should continue after interactive approval and skip prompts for compatible hosts', async () => {
    const plan = await planActivityMigration(root);
    const confirm = jest.fn().mockResolvedValue(true);
    await approveActivityMigration(plan, { interactive: true, confirm });
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockClear();
    for (const change of plan.changes) writeFileSync(change.path, change.after);
    await approveActivityMigration(await planActivityMigration(root), {
      ci: '1',
      interactive: false,
      confirm,
    });
    expect(confirm).not.toHaveBeenCalled();
  });
  it('should reject a noninteractive migration without an explicit flag', async () => {
    await expect(
      approveActivityMigration(await planActivityMigration(root), {
        interactive: false,
        confirm: jest.fn(),
      })
    ).rejects.toThrow('--migrate-activity=appcompat');
  });
});
