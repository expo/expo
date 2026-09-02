import {
  assertFilePlatform,
  buildEffectiveConfig,
  MOD_FILES,
  NOT_ATTRIBUTABLE,
  resolveModFile,
  resolvePlatformFilter,
  type IntrospectedConfig,
} from '../effective';
import { describeMod, formatEffectiveConfig, formatModFile } from '../format';
import fixture from './fixtures/introspect-sdk57.json';

/** The plugin ids the fixture's project declares, as `readStaticAppConfigAsync` would report them. */
const DECLARED = ['expo-brownfield', 'expo-splash-screen', 'expo-build-properties'];

function build(overrides: Partial<Parameters<typeof buildEffectiveConfig>[0]> = {}) {
  return buildEffectiveConfig({
    projectRoot: '/project',
    config: fixture as IntrospectedConfig,
    declaredPluginIds: DECLARED,
    command: ['expo', 'config', '--type', 'introspect', '--json'],
    durationMs: 1380,
    platform: 'all',
    file: null,
    ...overrides,
  });
}

describe(buildEffectiveConfig, () => {
  it('reshapes the introspected mods into a per-platform payload', () => {
    const report = build();

    expect(report.projectRoot).toBe('/project');
    expect(report.configuredSdkVersion).toBe('57.0.0');
    expect(report.source).toEqual({
      command: ['expo', 'config', '--type', 'introspect', '--json'],
      durationMs: 1380,
    });
    expect(Object.keys(report.platforms)).toEqual(['ios', 'android']);
    expect(Object.keys(report.platforms.ios!).sort()).toEqual([
      'entitlements',
      'expoPlist',
      'infoPlist',
      'podfileProperties',
      'splashScreenStoryboard',
    ]);
    expect(Object.keys(report.platforms.android!).sort()).toEqual([
      'colors',
      'colorsNight',
      'gradleProperties',
      'manifest',
      'strings',
      'styles',
    ]);
    // The values are handed through untouched: this command reshapes, it does not evaluate.
    expect(report.platforms.ios!.infoPlist).toEqual(
      (fixture as any)._internal.modResults.ios.infoPlist
    );
  });

  // The one thing an agent cannot work out for itself: a plugin that ran without being asked for
  // is in no app.json, so looking for it there finds nothing.
  it('marks a plugin the app config declared apart from one applied automatically', () => {
    const { plugins } = build();

    expect(plugins).toHaveLength(13);
    expect(plugins.filter((plugin) => plugin.declared)).toEqual([
      { name: 'expo-splash-screen', version: '57.0.5', declared: true },
    ]);
    expect(plugins).toContainEqual({
      name: 'expo-camera',
      version: '57.0.3',
      declared: false,
    });
    // `UNVERSIONED` is what a plugin that ships no version reports, and it is kept as it came.
    expect(plugins).toContainEqual({
      name: 'react-native-maps',
      version: 'UNVERSIONED',
      declared: false,
    });
    // Sorted, so two runs of the same project produce the same list.
    expect(plugins.map((plugin) => plugin.name)).toEqual(
      [...plugins.map((plugin) => plugin.name)].sort()
    );
  });

  // F132 [live, wave 31]: a real SDK 57 scaffold declares `expo-router`, `expo-splash-screen` and
  // `expo-build-properties`, and the report said `Plugins 10 (1 declared, 9 auto)` — one of the
  // three — while naming neither of the other two nor the reason
  // [`wave31-open-cells/evidence/60-inspect-plugins.out`, `61-inspect-plugins-human.out`; the raw
  // `pluginHistory` was checked against the same run and genuinely omits both]. This list is what
  // `pluginHistory` recorded, so a plugin that ran without recording itself is in no entry at all;
  // that limit was written in this file's comments and nowhere the reader could see it. It is the
  // same class as `notAttributable`, which *is* printed — and this half is worse, because a
  // declared plugin is one the caller wrote down and is looking for.
  it('names the plugins the config declared that the history cannot account for', () => {
    const report = build();

    expect(report.declaredNotApplied).toEqual(['expo-brownfield', 'expo-build-properties']);
    // The claim the count makes is unchanged; what is new is that the gap beside it is nameable.
    expect(report.plugins.filter((plugin) => plugin.declared)).toHaveLength(1);
  });

  it('names nothing when every declared plugin recorded itself', () => {
    expect(build({ declaredPluginIds: ['expo-splash-screen'] }).declaredNotApplied).toEqual([]);
  });

  it('matches a plugin declared by path against the name it recorded', () => {
    const config = {
      ...fixture,
      _internal: {
        ...(fixture as any)._internal,
        pluginHistory: {
          withThing: { name: 'withThing', version: 'UNVERSIONED' },
        },
      },
    } as IntrospectedConfig;

    expect(build({ config, declaredPluginIds: ['./plugins/withThing'] }).plugins).toEqual([
      { name: 'withThing', version: 'UNVERSIONED', declared: true },
    ]);
  });

  it('sorts the autolinked modules and names what introspection never covers', () => {
    const report = build();

    expect(report.expoAutolinkedModules).toContain('expo-camera');
    expect(report.expoAutolinkedModules).toEqual([...report.expoAutolinkedModules].sort());
    // The scope travels with the list, so a `--json` reader is told what it does not cover (F35).
    expect(report.expoAutolinkedModulesNote).toContain('Expo modules only');
    expect(report.expoAutolinkedModulesNote).toContain('React Native community modules');
    expect(report.notAttributable).toEqual(NOT_ATTRIBUTABLE);
    expect(report.notAttributable).toEqual(['ios.xcodeproj', '*.dangerous']);
  });

  it('keeps only the platform asked for', () => {
    expect(Object.keys(build({ platform: 'ios' }).platforms)).toEqual(['ios']);
    expect(Object.keys(build({ platform: 'android' }).platforms)).toEqual(['android']);
  });

  it('keeps only the mod asked for, and drops the platform that does not have it', () => {
    const report = build({ file: 'infoPlist' });

    expect(Object.keys(report.platforms)).toEqual(['ios']);
    expect(Object.keys(report.platforms.ios!)).toEqual(['infoPlist']);
  });

  // `_internal` is documented output, not a public API, so its absence is answered rather than
  // crashed on: an older CLI and a run that failed before the plugins compiled both end here.
  it('fails clearly when the payload carries no introspected results', () => {
    expect(() => build({ config: { sdkVersion: '57.0.0', slug: 'app' } })).toThrow(
      expect.objectContaining({ code: 'CONFIG_INTROSPECT_UNSUPPORTED' })
    );

    try {
      build({
        config: { _internal: { pluginHistory: {} } } as IntrospectedConfig,
      });
      throw new Error('expected the build to fail');
    } catch (error: any) {
      expect(error.code).toBe('CONFIG_INTROSPECT_UNSUPPORTED');
      // What, why, how — and the "how" is a command the reader can run.
      expect(error.message).toContain('no introspected native results');
      expect(error.message).toContain('_internal.modResults');
      expect(error.suggestedCommand).toBe('npx expo config --type introspect --json');
    }
  });

  it('reports no plugins rather than failing when the history is missing', () => {
    const config = {
      sdkVersion: '57.0.0',
      _internal: { modResults: { ios: { infoPlist: {} } } },
    } as IntrospectedConfig;

    const report = build({ config });
    expect(report.plugins).toEqual([]);
    expect(report.expoAutolinkedModules).toEqual([]);
  });
});

describe(resolvePlatformFilter, () => {
  it('defaults to every platform', () => {
    expect(resolvePlatformFilter(undefined)).toBe('all');
    expect(resolvePlatformFilter(null)).toBe('all');
  });

  it.each(['ios', 'android', 'all'])('accepts %s', (platform) => {
    expect(resolvePlatformFilter(platform)).toBe(platform);
  });

  it('rejects anything else, naming the platforms it takes', () => {
    expect(() => resolvePlatformFilter('web')).toThrow(
      expect.objectContaining({ code: 'BAD_ARGS' })
    );
    expect(() => resolvePlatformFilter('web')).toThrow(/ios, android, or all/);
  });
});

describe(resolveModFile, () => {
  it('takes every mod introspection produces', () => {
    for (const file of Object.keys(MOD_FILES)) {
      expect(resolveModFile(file)).toBe(file);
    }
  });

  it('is null when the flag was not passed', () => {
    expect(resolveModFile(undefined)).toBeNull();
    expect(resolveModFile(null)).toBeNull();
  });

  // An unknown name is answered with the ones that exist, never with an empty report that reads
  // like "this project has no such file".
  it('rejects a name that is no mod, listing the ones that are', () => {
    expect(() => resolveModFile('AndroidManifest.xml')).toThrow(
      expect.objectContaining({ code: 'BAD_ARGS' })
    );
    expect(() => resolveModFile('AndroidManifest.xml')).toThrow(/infoPlist/);
  });
});

describe(assertFilePlatform, () => {
  it('allows a file whose platform was not narrowed away', () => {
    expect(() => assertFilePlatform('infoPlist', 'all')).not.toThrow();
    expect(() => assertFilePlatform('infoPlist', 'ios')).not.toThrow();
    expect(() => assertFilePlatform(null, 'ios')).not.toThrow();
  });

  it('rejects a pair that could only ever be empty', () => {
    expect(() => assertFilePlatform('manifest', 'ios')).toThrow(
      expect.objectContaining({ code: 'BAD_ARGS' })
    );
    expect(() => assertFilePlatform('manifest', 'ios')).toThrow(/--platform android/);
  });
});

describe(formatEffectiveConfig, () => {
  it('prints one labelled line per fact, with a count per mod', () => {
    expect(formatEffectiveConfig(build())).toMatchInlineSnapshot(`
      "Project      /project
      SDK          57.0.0 per config
      Plugins      13 (1 declared, 12 auto) — 2 declared not in the history: expo-brownfield, expo-build-properties
      Autolinked   12 Expo modules (React Native community modules link separately)
      ios          podfileProperties 10 keys, infoPlist 8 keys, splashScreenStoryboard 1 key, entitlements 1 key, expoPlist 4 keys
      android      manifest 7 permissions, gradleProperties 9 properties, styles 2 styles, colors 4 colors, colorsNight 0 colors, strings 2 strings
      Not covered  ios.xcodeproj, *.dangerous"
    `);
  });
});

// The unit is per mod because the counts mean different things, and a count with the wrong noun on
// it is worse than no count.
describe(describeMod, () => {
  it.each([
    ['infoPlist', { a: 1, b: 2 }, 'infoPlist 2 keys'],
    ['entitlements', { a: 1 }, 'entitlements 1 key'],
    ['manifest', { manifest: { 'uses-permission': [{}, {}, {}] } }, 'manifest 3 permissions'],
    ['manifest', { manifest: {} }, 'manifest 0 permissions'],
    [
      'gradleProperties',
      [{ type: 'comment' }, { type: 'property' }, { type: 'empty' }],
      'gradleProperties 1 property',
    ],
    ['strings', { resources: { string: [{}, {}] } }, 'strings 2 strings'],
    ['colors', { resources: { color: [{}] } }, 'colors 1 color'],
    ['colorsNight', { resources: {} }, 'colorsNight 0 colors'],
    ['styles', { resources: { style: [{}, {}] } }, 'styles 2 styles'],
    ['somethingNew', [1, 2], 'somethingNew 2 entries'],
    ['somethingNew', [1], 'somethingNew 1 entry'],
    ['somethingNew', 'a string', 'somethingNew'],
  ])('describes %s', (mod, value, expected) => {
    expect(describeMod(mod, value)).toBe(expected);
  });
});

describe(formatModFile, () => {
  it('prints a flat file as sorted key/value lines under its platform header', () => {
    expect(formatModFile(build({ file: 'infoPlist' }), 'infoPlist')).toMatchInlineSnapshot(`
      "ios.infoPlist
      CFBundleIdentifier $(PRODUCT_BUNDLE_IDENTIFIER)
      CFBundleName $(PRODUCT_NAME)
      CFBundleShortVersionString 1.0.0
      CFBundleVersion 1
      NSAppTransportSecurity {"NSAllowsArbitraryLoads":false,"NSAllowsLocalNetworking":true}
      NSCameraUsageDescription Allow $(PRODUCT_NAME) to access your camera
      UILaunchStoryboardName SplashScreen
      UIStatusBarStyle UIStatusBarStyleDefault"
    `);
  });

  // A manifest is a document tree with ordered children, so flattening it to `key value` would lose
  // the order that makes it a manifest.
  it('prints a document-tree mod as JSON', () => {
    const printed = formatModFile(build({ file: 'strings', platform: 'android' }), 'strings');

    expect(printed).toContain('android.strings');
    expect(printed).toContain('"resources"');
    expect(JSON.parse(printed.split('\n').slice(1).join('\n'))).toEqual(
      (fixture as any)._internal.modResults.android.strings
    );
  });

  // Not an error: the plugins produced no entitlements, and that is an answer.
  it('says so when the project produced no such file', () => {
    const report = build({ file: 'expoPlist' });
    expect(formatModFile(report, 'colorsNight')).toContain('No colorsNight was produced');
  });
});
