import { vol } from 'memfs';

import {
  buildOpenUrlCommand,
  quoteForDeviceShell,
  readProjectSchemeConfig,
  resolveDeepLinkUrl,
  type ProjectSchemeConfig,
  type ResolveDeepLinkUrlResult,
} from '../deepLink';

const PROJECT_ROOT = '/fixtures/project';

/** Create a project fixture in memory from a map of file name to contents. */
function createProjectFixture(files: Record<string, string>): string {
  vol.fromJSON(files, PROJECT_ROOT);
  // fromJSON does not create the directory when there are no files in it.
  vol.mkdirSync(PROJECT_ROOT, { recursive: true });
  return PROJECT_ROOT;
}

function config(overrides: Partial<ProjectSchemeConfig> = {}): ProjectSchemeConfig {
  return { scheme: null, slug: null, configFile: null, dynamicConfigFile: null, ...overrides };
}

/** Assert the resolution failed and return its error message. */
function expectError(result: ResolveDeepLinkUrlResult): string {
  if (result.ok) {
    throw new Error(`Expected a failure, but got the URL ${result.url}`);
  }
  return result.error;
}

/** Assert the resolution succeeded and return it, so its `resolution` can be read. */
function expectUrl(
  result: ResolveDeepLinkUrlResult
): Extract<ResolveDeepLinkUrlResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(`Expected a URL, but the resolution failed: ${result.error}`);
  }
  return result;
}

afterEach(() => {
  vol.reset();
});

describe(readProjectSchemeConfig, () => {
  it(`should read the scheme and slug from app.json`, () => {
    const projectRoot = createProjectFixture({
      'app.json': JSON.stringify({ expo: { name: 'Demo', slug: 'demo', scheme: 'demoapp' } }),
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: 'demoapp',
      slug: 'demo',
      configFile: 'app.json',
      dynamicConfigFile: null,
    });
  });

  it(`should take the first entry when scheme is an array`, () => {
    const projectRoot = createProjectFixture({
      'app.json': JSON.stringify({ expo: { slug: 'demo', scheme: ['demoapp', 'demoapp-alt'] } }),
    });

    expect(readProjectSchemeConfig(projectRoot).scheme).toBe('demoapp');
  });

  it(`should accept a config without the expo key`, () => {
    const projectRoot = createProjectFixture({
      'app.json': JSON.stringify({ slug: 'bare', scheme: 'bareapp' }),
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: 'bareapp',
      slug: 'bare',
      configFile: 'app.json',
      dynamicConfigFile: null,
    });
  });

  it(`should fall back to app.config.json when app.json is absent`, () => {
    const projectRoot = createProjectFixture({
      'app.config.json': JSON.stringify({ expo: { slug: 'demo', scheme: 'fromconfigjson' } }),
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: 'fromconfigjson',
      slug: 'demo',
      configFile: 'app.config.json',
      dynamicConfigFile: null,
    });
  });

  it(`should return a null scheme when app.json has only a slug`, () => {
    const projectRoot = createProjectFixture({
      'app.json': JSON.stringify({ expo: { slug: 'demo' } }),
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: null,
      slug: 'demo',
      configFile: 'app.json',
      dynamicConfigFile: null,
    });
  });

  it(`should ignore an empty scheme value`, () => {
    const projectRoot = createProjectFixture({
      'app.json': JSON.stringify({ expo: { slug: 'demo', scheme: '   ' } }),
    });

    expect(readProjectSchemeConfig(projectRoot).scheme).toBeNull();
  });

  it(`should report a dynamic config file it cannot read`, () => {
    const projectRoot = createProjectFixture({
      'app.config.js': 'module.exports = { expo: { scheme: "dynamic" } };',
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: null,
      slug: null,
      configFile: null,
      dynamicConfigFile: 'app.config.js',
    });
  });

  it(`should fall back to the package.json name for the slug`, () => {
    const projectRoot = createProjectFixture({
      'package.json': JSON.stringify({ name: 'from-package-json' }),
    });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: null,
      slug: 'from-package-json',
      configFile: null,
      dynamicConfigFile: null,
    });
  });

  it(`should return nulls for a malformed config instead of throwing`, () => {
    const projectRoot = createProjectFixture({ 'app.json': '{ not json' });

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: null,
      slug: null,
      configFile: null,
      dynamicConfigFile: null,
    });
  });

  it(`should return nulls for a project with no config files`, () => {
    const projectRoot = createProjectFixture({});

    expect(readProjectSchemeConfig(projectRoot)).toEqual({
      scheme: null,
      slug: null,
      configFile: null,
      dynamicConfigFile: null,
    });
  });
});

describe(resolveDeepLinkUrl, () => {
  it(`should pass a full custom-scheme URL through unchanged`, () => {
    const result = resolveDeepLinkUrl({
      route: 'myapp://profile/42',
      config: config({ scheme: 'other' }),
      isExpoGo: false,
    });

    expect(result).toEqual({
      ok: true,
      host: null,
      url: 'myapp://profile/42',
      resolution: 'the route was already a full URL, so it was used unchanged',
    });
  });

  it(`should pass a full https URL through unchanged`, () => {
    const result = resolveDeepLinkUrl({
      route: 'https://example.com/profile/42',
      config: config(),
      isExpoGo: true,
      devServerUrl: 'http://localhost:8081',
    });

    expect(result).toEqual({
      ok: true,
      host: null,
      url: 'https://example.com/profile/42',
      resolution: 'the route was already a full URL, so it was used unchanged',
    });
  });

  it(`should prefer the scheme flag over Expo Go and the config`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      schemeOverride: 'override',
      config: config({ scheme: 'fromconfig', configFile: 'app.json' }),
      isExpoGo: true,
      devServerUrl: 'http://localhost:8081',
    });

    expect(result).toEqual({
      ok: true,
      host: null,
      url: 'override://profile/42',
      resolution: 'used the --scheme flag',
    });
  });

  it(`should trim a trailing :// from the scheme flag`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      schemeOverride: 'myapp://',
      config: config(),
      isExpoGo: false,
    });

    expect(result).toMatchObject({ ok: true, url: 'myapp://profile/42' });
  });

  it(`should build the exp:// shape for Expo Go`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      config: config({ scheme: 'demoapp', configFile: 'app.json' }),
      isExpoGo: true,
      devServerUrl: 'http://localhost:8081',
    });

    expect(result).toEqual({
      ok: true,
      host: 'localhost:8081',
      url: 'exp://localhost:8081/--/profile/42',
      resolution:
        'target app is Expo Go, so the exp:// shape was used with dev server host localhost:8081',
    });
  });

  // The root route needs a URL that survives expo-router's Expo Go listener: an `exp://` link
  // whose path is empty or `/` is replaced by the root URL, which in Expo Go is the empty string,
  // and then dropped by a truthiness check before the router sees it. A bare `?` is the smallest
  // thing that survives it and still resolves to the index route.
  it(`should keep the root route addressable on Expo Go`, () => {
    const result = resolveDeepLinkUrl({
      route: '/',
      config: config(),
      isExpoGo: true,
      devServerUrl: 'http://192.168.1.10:8081',
    });

    expect(result).toMatchObject({ ok: true, url: 'exp://192.168.1.10:8081/--/?' });
    expect(expectUrl(result).resolution).toContain('root route');
  });

  it(`should reach the root the same way for every spelling of it`, () => {
    for (const route of ['/', '//', ' / ']) {
      expect(
        resolveDeepLinkUrl({
          route,
          config: config(),
          isExpoGo: true,
          devServerUrl: 'http://192.168.1.10:8081',
        })
      ).toMatchObject({ url: 'exp://192.168.1.10:8081/--/?' });
    }
  });

  // A development build never had the problem: its listener passes the URL through whatever the
  // path is, so `myapp://` already means the index route and a `?` would only be noise.
  it(`should leave the root route of a development build alone`, () => {
    expect(
      resolveDeepLinkUrl({
        route: '/',
        config: config({ scheme: 'demoapp', configFile: 'app.json' }),
        isExpoGo: false,
      })
    ).toMatchObject({ ok: true, url: 'demoapp://' });
  });

  it(`should explain how to fix a missing dev server URL for Expo Go`, () => {
    const result = resolveDeepLinkUrl({ route: '/profile/42', config: config(), isExpoGo: true });

    const error = expectError(result);
    expect(error).toContain('the dev server URL is unknown');
    expect(error).toContain('npx @expo/agent-cli dev --detach');
  });

  it(`should use the config scheme for a development build`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      config: config({ scheme: 'demoapp', slug: 'demo', configFile: 'app.json' }),
      isExpoGo: false,
    });

    expect(result).toEqual({
      ok: true,
      host: null,
      url: 'demoapp://profile/42',
      resolution: 'read the "scheme" field from app.json',
    });
  });

  it(`should keep a query string on the route`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42?tab=posts',
      config: config({ scheme: 'demoapp', configFile: 'app.json' }),
      isExpoGo: false,
    });

    expect(result).toMatchObject({ ok: true, url: 'demoapp://profile/42?tab=posts' });
  });

  it(`should collapse repeated leading slashes`, () => {
    const result = resolveDeepLinkUrl({
      route: '//profile/42',
      config: config({ scheme: 'demoapp', configFile: 'app.json' }),
      isExpoGo: false,
    });

    expect(result).toMatchObject({ ok: true, url: 'demoapp://profile/42' });
  });

  it(`should accept a route without a leading slash`, () => {
    const result = resolveDeepLinkUrl({
      route: 'profile/42',
      config: config({ scheme: 'demoapp', configFile: 'app.json' }),
      isExpoGo: false,
    });

    expect(result).toMatchObject({ ok: true, url: 'demoapp://profile/42' });
  });

  it(`should fall back to exp+<slug> when the config has no scheme`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      config: config({ slug: 'demo', configFile: 'app.json' }),
      isExpoGo: false,
    });

    expect(result).toEqual({
      ok: true,
      host: null,
      url: 'exp+demo://profile/42',
      resolution:
        'no "scheme" field was found, so the development build default exp+<slug>:// was used with slug "demo"',
    });
  });

  it(`should name the dynamic config file when nothing is resolvable`, () => {
    const result = resolveDeepLinkUrl({
      route: '/profile/42',
      config: config({ dynamicConfigFile: 'app.config.ts' }),
      isExpoGo: false,
    });

    const error = expectError(result);
    expect(error).toContain('app.config.ts');
    expect(error).toContain('--scheme');
  });

  it(`should reject an empty route`, () => {
    const result = resolveDeepLinkUrl({ route: '   ', config: config(), isExpoGo: false });

    expect(expectError(result)).toContain('nothing to navigate to');
  });

  // @ref llp/0021-honest-reports.rfc.md §How they show up — F58, S5, F103,
  // and now **F142.** `navigate / --ios` against a dev server that had died recovered into
  // `npx @expo/agent-cli dev --detach`, which on this machine plans for whatever platform the probe picks —
  // so the one line the caller was told to run was a different run from the one they asked for, and
  // the `--ios` they had typed was gone from the loop.
  describe('the platform the caller named', () => {
    const platforms = [['ios'], ['android']] as const;

    it.each(platforms)(`survives into the recovery for a missing dev server (--%s)`, (platform) => {
      const result = resolveDeepLinkUrl({
        route: '/profile/42',
        config: config(),
        isExpoGo: true,
        platform,
      });

      expect(expectError(result)).toContain(`npx @expo/agent-cli dev --detach --${platform}`);
      expect(result.ok === false && result.suggestedCommand).toBe(
        `npx @expo/agent-cli dev --detach --${platform}`
      );
    });

    it.each(platforms)(`survives into the recovery for an empty route (--%s)`, (platform) => {
      const result = resolveDeepLinkUrl({
        route: '  ',
        config: config(),
        isExpoGo: true,
        platform,
      });

      expect(result.ok === false && result.suggestedCommand).toBe(
        `npx @expo/agent-cli navigate / --${platform}`
      );
    });

    // A caller who named none is offered none: a flag nobody typed would claim they asked for it,
    // which is the other half of the same rule (`buildStartPlanFollowUps`, F103).
    it(`is absent when the caller named none`, () => {
      const result = resolveDeepLinkUrl({ route: '/profile/42', config: config(), isExpoGo: true });

      expect(result.ok === false && result.suggestedCommand).toBe(
        'npx @expo/agent-cli dev --detach'
      );
    });
  });
});

describe(buildOpenUrlCommand, () => {
  it(`should build a simctl openurl command for iOS`, () => {
    const command = buildOpenUrlCommand({
      platform: 'ios',
      deviceId: 'ABCD-1234',
      url: 'demoapp://profile/42',
      appId: 'com.example.demo',
    });

    expect(command.bin).toBe('xcrun');
    expect(command.args).toEqual(['simctl', 'openurl', 'ABCD-1234', 'demoapp://profile/42']);
    expect(command.display).toBe('xcrun simctl openurl ABCD-1234 demoapp://profile/42');
  });

  it(`should build an ACTION_VIEW intent scoped to the package for Android`, () => {
    const command = buildOpenUrlCommand({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
      appId: 'com.example.demo',
    });

    expect(command.bin).toBe('adb');
    expect(command.args).toEqual([
      '-s',
      'emulator-5554',
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-c',
      'android.intent.category.BROWSABLE',
      '-d',
      `'demoapp://profile/42'`,
      'com.example.demo',
    ]);
  });

  it(`should omit the package when no appId is given on Android`, () => {
    const command = buildOpenUrlCommand({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
    });

    expect(command.args.at(-1)).toBe(`'demoapp://profile/42'`);
  });
});

describe(quoteForDeviceShell, () => {
  it(`should quote a URL with a query string so the device shell keeps it whole`, () => {
    expect(quoteForDeviceShell('demoapp://profile/42?tab=posts&sort=new')).toBe(
      `'demoapp://profile/42?tab=posts&sort=new'`
    );
  });

  it(`should escape single quotes inside the value`, () => {
    expect(quoteForDeviceShell("demoapp://search?q=o'brien")).toBe(
      `'demoapp://search?q=o'\\''brien'`
    );
  });
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts — friction run 5. The last
// line of a failure is what a driving agent runs, and one `Try:` served all three of these:
// `npx @expo/agent-cli navigate <route> --scheme <your-app-scheme>`, which has two holes in it and so is
// not a command at all. Each failure carries the command that answers *it* now.
describe('the Try: line of a URL that could not be resolved', () => {
  const config = { scheme: null, slug: null, configFile: 'app.json', dynamicConfigFile: null };

  it(`answers a missing dev server with the command that starts one`, () => {
    const result = resolveDeepLinkUrl({
      route: '/notes',
      config,
      isExpoGo: true,
      devServerUrl: null,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.suggestedCommand).toBe('npx @expo/agent-cli dev --detach');
    // The How: and the Try: name the same action, which they did not.
    expect(result.error).toContain('npx @expo/agent-cli dev --detach');
  });

  // The one case where a person has to supply a value this CLI cannot know, so the runnable
  // command is the one that prints what the project *does* declare.
  it(`answers a project with no scheme with a command that has no holes in it`, () => {
    const result = resolveDeepLinkUrl({
      route: '/notes',
      config,
      isExpoGo: false,
      devServerUrl: 'http://127.0.0.1:8081',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.suggestedCommand).not.toContain('<');
  });

  it(`never suggests a command with a placeholder in it`, () => {
    for (const params of [
      { route: '', config, isExpoGo: true, devServerUrl: null },
      { route: '/notes', config, isExpoGo: true, devServerUrl: null },
      { route: '/notes', config, isExpoGo: false, devServerUrl: 'http://127.0.0.1:8081' },
    ]) {
      const result = resolveDeepLinkUrl(params);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.suggestedCommand).not.toMatch(/[<>]/);
      }
    }
  });
});
