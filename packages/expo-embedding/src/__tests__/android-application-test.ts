import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { planActivityMigration } from '../android-activity';
import { approveHostConfiguration, planApplicationConfiguration } from '../android-application';
describe('Configuring the Android Application', () => {
  let root: string;
  const manifestPath = 'app/src/main/AndroidManifest.xml';
  const applicationPath = 'app/src/main/java/example/MainApplication.kt';
  function write(path: string, content: string) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  const read = (path: string) => readFileSync(join(root, path), 'utf8');
  function declareApplication(content: string, name = '.MainApplication') {
    write(applicationPath, content);
    write(
      manifestPath,
      read(manifestPath).replace('<application', `<application android:name="${name}"`)
    );
  }
  async function applyPlan() {
    const plan = await planApplicationConfiguration(root);
    for (const change of plan.changes) {
      mkdirSync(join(change.path, '..'), { recursive: true });
      writeFileSync(change.path, change.after);
    }
    return plan;
  }
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-application-test-'));
    write('app/build.gradle.kts', 'android { namespace = "example" }');
    write(
      manifestPath,
      `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Preserve host settings. -->
  <application android:label="Host" android:theme="@style/Theme.Host">
    <activity android:name=".MainActivity" />
  </application>
</manifest>`
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('should plan a composed Application and register its fully qualified name', async () => {
    const before = read(manifestPath);
    const plan = await planApplicationConfiguration(root);
    const source = plan.changes.find((change) => change.path.endsWith('MainApplication.kt'))!;
    const manifest = plan.changes.find((change) => change.path.endsWith('.xml'))!;
    expect(source.before).toBeUndefined();
    expect(source.after).toContain('package example');
    expect(source.after).toContain('Application(), ReactApplication by expo');
    expect(source.after).toContain('expo.onCreate(this)');
    expect(source.after).toContain('expo.onConfigurationChanged(newConfig)');
    expect(manifest.after).toBe(
      before.replace('<application', '<application android:name="example.MainApplication"')
    );
    expect(read(manifestPath)).toBe(before);
    expect(existsSync(join(root, applicationPath))).toBe(false);
  });
  it('should preserve the generated Application and manifest on repeated setup', async () => {
    await applyPlan();
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should retain Activity migration when both host classes share a Kotlin file', async () => {
    declareApplication(`package example
import android.app.Application
import androidx.activity.ComponentActivity
class MainApplication : Application() {}
class MainActivity : ComponentActivity() {}
`);
    write(
      manifestPath,
      read(manifestPath).replace(
        '<activity android:name=".MainActivity" />',
        `<activity android:name=".MainActivity"><intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter></activity>`
      )
    );
    write(
      'app/src/main/res/values/themes.xml',
      '<resources><style name="Theme.Host" parent="android:Theme.Material.Light.NoActionBar" /></resources>'
    );
    const activity = await planActivityMigration(root);
    const before = read(applicationPath);
    const application = await planApplicationConfiguration(root, activity.changes);
    const changes = new Map(
      [...activity.changes, ...application.changes].map((change) => [change.path, change])
    );
    const combined = changes.get(join(root, applicationPath))!;
    expect(combined.before).toBe(before);
    expect(combined.after).toContain('class MainActivity : AppCompatActivity()');
    expect(combined.after).toContain('Application(), ReactApplication by expo');
    expect(read(applicationPath)).toBe(before);
    for (const change of changes.values()) writeFileSync(change.path, change.after);
    expect((await planActivityMigration(root)).changes).toEqual([]);
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should preserve custom options on an already configured Expo delegate', async () => {
    await applyPlan();
    write(
      applicationPath,
      read(applicationPath).replace(
        '= ExpoApplicationDelegate()',
        '= ExpoApplicationDelegate(bundleSource = expo.embedding.ExpoHost.BundleSource.DevelopmentServer)'
      )
    );
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should reject an unregistered MainApplication collision without overwriting it', async () => {
    write(applicationPath, 'package example\nclass MainApplication');
    await expect(planApplicationConfiguration(root)).rejects.toThrow('already exists');
    expect(read(applicationPath)).toBe('package example\nclass MainApplication');
  });
  it('should find a conflicting declaration in a differently named Kotlin file', async () => {
    write('app/src/main/kotlin/example/Bootstrap.kt', 'package example\nclass MainApplication');
    await expect(planApplicationConfiguration(root)).rejects.toThrow('already exists');
  });
  it('should add composition to an existing Application while retaining its superclass and callbacks', async () => {
    declareApplication(`package example
import android.content.res.Configuration
class MainApplication : CompanyApplication() {
  override fun onCreate() {
    super.onCreate()
    initializeAnalytics()
  }
  override fun onConfigurationChanged(config: Configuration) {
    super.onConfigurationChanged(config)
    updateLocale(config)
  }
}`);
    const plan = await planApplicationConfiguration(root);
    expect(plan.changes).toHaveLength(1);
    const after = plan.changes[0].after;
    expect(after).toContain('CompanyApplication(), ReactApplication by expo');
    expect(after).toContain('super.onCreate()\n    expo.onCreate(this)\n    initializeAnalytics()');
    expect(after).toContain(
      'super.onConfigurationChanged(config)\n    expo.onConfigurationChanged(config)\n    updateLocale(config)'
    );
    await applyPlan();
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should add missing lifecycle overrides to an empty Application', async () => {
    declareApplication(
      'package example\nimport android.app.Application\nclass MainApplication : Application()'
    );
    const plan = await applyPlan();
    expect(plan.changes[0].after).toContain('override fun onCreate()');
    expect(plan.changes[0].after).toContain(
      'override fun onConfigurationChanged(newConfig: android.content.res.Configuration)'
    );
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should insert imports after the package declaration when no imports exist', async () => {
    declareApplication('package example\nclass MainApplication : android.app.Application() {}');
    const after = (await applyPlan()).changes[0].after;
    expect(after.indexOf('import expo.embedding.ExpoApplicationDelegate')).toBeLessThan(
      after.indexOf('class MainApplication')
    );
    expect((await planApplicationConfiguration(root)).changes).toEqual([]);
  });
  it('should reject a multiline conditional super call', async () => {
    declareApplication(
      'package example\nclass MainApplication : Application() {\n  override fun onCreate() {\n    if (enabled)\n      super.onCreate()\n  }\n}'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('super.onCreate');
  });
  it('should reject unsupported modifier order instead of adding a duplicate callback', async () => {
    declareApplication(
      'package example\nclass MainApplication : Application() { override public fun onCreate() { super.onCreate() } }'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('onCreate');
  });
  it('should reject a chained super call instead of moving its side effects', async () => {
    declareApplication(
      'package example\nclass MainApplication : Application() { override fun onCreate() { super.onCreate().also { initialize() } } }'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('super.onCreate');
  });
  it('should preserve a self-closing application tag and explicitly configured default Application', async () => {
    write(
      manifestPath,
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:name="android.app.Application" android:label="Host" /></manifest>'
    );
    await applyPlan();
    expect(read(manifestPath)).toContain(
      'android:name="example.MainApplication" android:label="Host" />'
    );
  });
  it('should reject unresolved manifest placeholders', async () => {
    write(
      manifestPath,
      read(manifestPath).replace('<application', '<application android:name="${applicationName}"')
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('literal');
  });
  it('should not overwrite an existing ReactApplication integration', async () => {
    declareApplication(
      'package example\nclass MainApplication : Application(), ReactApplication { override val reactHost = customHost }'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('ReactApplication');
  });
  it('should reject a callback without a direct super call instead of changing its control flow', async () => {
    declareApplication(
      'package example\nclass MainApplication : Application() { override fun onCreate() { if (enabled) { super.onCreate() } } }'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('super.onCreate');
  });
  it('should reject custom constructors and member name collisions', async () => {
    declareApplication('package example\nclass MainApplication(val value: Int) : Application()');
    await expect(planApplicationConfiguration(root)).rejects.toThrow('constructor');
    write(
      applicationPath,
      'package example\nclass MainApplication : Application() { val expo = customValue }'
    );
    await expect(planApplicationConfiguration(root)).rejects.toThrow('expo');
  });
  it('should require configure-host rather than treating the Activity flag as Application consent', async () => {
    const application = await planApplicationConfiguration(root);
    const activity = { root, activityName: 'example.MainActivity', changes: [] };
    const confirm = jest.fn();
    await expect(
      approveHostConfiguration(activity, application, {
        migrate: 'appcompat',
        ci: '1',
        interactive: false,
        confirm,
      })
    ).rejects.toThrow('--configure-host');
    expect(confirm).not.toHaveBeenCalled();
  });
  it('should authorize combined host changes explicitly without prompting in CI', async () => {
    const application = await planApplicationConfiguration(root);
    const activity = {
      root,
      activityName: 'example.MainActivity',
      changes: [{ path: 'Activity.kt', before: 'old', after: 'new' }],
    };
    const confirm = jest.fn();
    await approveHostConfiguration(activity, application, {
      configureHost: true,
      ci: '1',
      interactive: false,
      confirm,
    });
    expect(confirm).not.toHaveBeenCalled();
  });
  it('should ask once for combined edits and stop on decline without writing', async () => {
    const application = await planApplicationConfiguration(root);
    const activity = { root, activityName: 'example.MainActivity', changes: [] };
    const confirm = jest.fn().mockResolvedValue(false);
    await expect(
      approveHostConfiguration(activity, application, { interactive: true, confirm })
    ).rejects.toThrow('declined');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(existsSync(join(root, applicationPath))).toBe(false);
  });
});
