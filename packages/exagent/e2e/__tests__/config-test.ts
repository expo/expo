/* eslint-env jest */
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
//
// `exagent config:effective` is orchestration: it runs the project's `expo` CLI and reshapes what
// it printed. These tests drive the published CLI against the stub `expo` bin of the fixtures
// (`e2e/fixtures/README.md`), so the whole path — the registry, the subprocess, the parse, the
// three output channels — is asserted without evaluating a real config.
//
// They also pin the half of the registry rule that has no unit test to catch it: with the real
// `config` group registered, a bare `exagent config` must still reach `expo config`.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  getTemporaryPath,
  readStubExpoInvocations,
  setupFixtureAsync,
} from '../utils';

/** The shape `config:effective --json` prints, per `src/config/types.ts`. */
type EffectiveConfigPayload = {
  projectRoot: string;
  configuredSdkVersion: string | null;
  source: { command: string[]; durationMs: number };
  platforms: { [platform: string]: { [mod: string]: unknown } };
  plugins: { name: string; version: string | null; declared: boolean }[];
  expoAutolinkedModules: string[];
  expoAutolinkedModulesNote: string;
  notAttributable: string[];
  followups: { id: string; command: string; why: string }[];
};

/**
 * The introspected config the stub `expo` prints.
 *
 * Small on purpose: the reshaping is pinned against a recorded SDK 57 payload in
 * `src/config/__tests__/`, and what these tests need from it is the shape, not the size.
 */
const STUB_CONFIG = {
  name: 'go-app',
  slug: 'go-app',
  sdkVersion: '54.0.0',
  _internal: {
    projectRoot: '/project',
    pluginHistory: {
      'expo-camera': { name: 'expo-camera', version: '17.0.0' },
      'expo-notifications': { name: 'expo-notifications', version: 'UNVERSIONED' },
    },
    autolinkedModules: ['expo-camera', 'expo'],
    modResults: {
      ios: {
        infoPlist: {
          CFBundleName: 'go-app',
          NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        },
        entitlements: { 'com.apple.developer.applesignin': ['Default'] },
      },
      android: {
        manifest: {
          manifest: {
            'uses-permission': [
              { $: { 'android:name': 'android.permission.CAMERA' } },
              { $: { 'android:name': 'android.permission.INTERNET' } },
            ],
          },
        },
        gradleProperties: [
          { type: 'comment', value: 'Project-wide Gradle settings.' },
          { type: 'property', key: 'newArchEnabled', value: 'true' },
        ],
      },
    },
  },
};

/**
 * Copy a fixture, declare `expo-camera` in its `app.json`, and write the payload the stub
 * `expo config` will print.
 *
 * The declared half of the plugin list is deliberately not read out of the payload: it comes from
 * the project's own static app config, which is the only place that says what the project *asked*
 * for. So the fixture has to declare it, or the join has nothing to join.
 *
 * @returns the project root as the CLI reports it, with symlinks resolved — on macOS the temporary
 *   directory is one, and a subprocess reports the resolved path.
 */
async function setupAsync(
  fixtureName: string,
  config: unknown = STUB_CONFIG
): Promise<{ projectRoot: string; env: Record<string, string> }> {
  const projectRoot = await fs.promises.realpath(await setupFixtureAsync(fixtureName));

  const appConfigPath = path.join(projectRoot, 'app.json');
  const appConfig = JSON.parse(await fs.promises.readFile(appConfigPath, 'utf8'));
  appConfig.expo.plugins = ['expo-camera'];
  await fs.promises.writeFile(appConfigPath, JSON.stringify(appConfig, null, 2));

  // Outside the project, so nothing under test can read it as a project file.
  const payloadPath = path.join(getTemporaryPath(), 'stub-expo-config.json');
  await fs.promises.mkdir(path.dirname(payloadPath), { recursive: true });
  await fs.promises.writeFile(
    payloadPath,
    typeof config === 'string' ? config : JSON.stringify(config)
  );
  return { projectRoot, env: { STUB_EXPO_CONFIG_JSON: payloadPath } };
}

describe('exagent config:effective', () => {
  it('introspects through the expo CLI and prints the report as JSON', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective', '--json'], { env });

    expect(result.exitCode).toBe(0);
    const payload: EffectiveConfigPayload = JSON.parse(result.stdout);

    // The subprocess is the whole config evaluation, so what it was asked is part of the contract.
    expect(readStubExpoInvocations(projectRoot).map((invocation) => invocation.args)).toEqual([
      ['config', '--type', 'introspect', '--json'],
    ]);
    expect(payload.source.command).toEqual(['expo', 'config', '--type', 'introspect', '--json']);
    expect(payload.configuredSdkVersion).toBe('54.0.0');
    expect(payload.platforms.ios).toEqual(STUB_CONFIG._internal.modResults.ios);
    expect(payload.platforms.android).toEqual(STUB_CONFIG._internal.modResults.android);
    expect(payload.notAttributable).toEqual(['ios.xcodeproj', '*.dangerous']);
    expect(payload.expoAutolinkedModules).toEqual(['expo', 'expo-camera']);
    // F35: the list is Expo-module autolinking only, and the name and the note both say so, so an
    // agent asking "is my native dependency linked?" is not told no by the wrong list.
    expect(Object.keys(payload)).not.toContain('autolinkedModules');
    expect(payload.expoAutolinkedModulesNote).toContain('Expo modules only');
  });

  // `status --json` reports the installed `expo` version under `sdkVersion`, and this reports the
  // SDK the evaluated config resolves to. They are different numbers for the same project — 57.0.15
  // against 57.0.0 — so sharing one field name read as the two commands disagreeing.
  it('never calls the SDK of the config `sdkVersion`, which status already means', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective', '--json'], { env });
    const payload = JSON.parse(result.stdout) as Record<string, unknown>;

    expect(payload).toHaveProperty('configuredSdkVersion', '54.0.0');
    expect(Object.keys(payload)).not.toContain('sdkVersion');
  });

  it('says which SDK it means in the human report', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective'], { env });

    expect(result.stdout).toContain('54.0.0 per config');
  });

  // The one answer an agent cannot work out on its own: `expo-notifications` ran and is in no
  // `app.json`, because an installed package applied it.
  it('marks a declared plugin apart from an auto-applied one', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective', '--json'], { env });
    const payload: EffectiveConfigPayload = JSON.parse(result.stdout);

    expect(payload.plugins).toEqual([
      { name: 'expo-camera', version: '17.0.0', declared: true },
      { name: 'expo-notifications', version: 'UNVERSIONED', declared: false },
    ]);
  });

  it('prints a terse labelled report for a terminal', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`Project      ${projectRoot}`);
    expect(result.stdout).toContain('SDK          54.0.0');
    expect(result.stdout).toContain('Plugins      2 (1 declared, 1 auto)');
    expect(result.stdout).toContain('infoPlist 2 keys');
    expect(result.stdout).toContain('manifest 2 permissions');
    expect(result.stdout).toContain('gradleProperties 1 property');
    expect(result.stdout).toContain('Not covered  ios.xcodeproj, *.dangerous');
    // The values are the report's, not the summary's.
    expect(result.stdout).not.toContain('NSCameraUsageDescription');
  });

  it('prints one native file as sorted key/value lines', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['config:effective', '--file', 'infoPlist'],
      { env }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim().split('\n')).toEqual([
      'ios.infoPlist',
      'CFBundleName go-app',
      'NSCameraUsageDescription Allow $(PRODUCT_NAME) to access your camera',
    ]);
  });

  it('keeps only the platform asked for', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['config:effective', '--platform', 'ios', '--json'],
      { env }
    );

    expect(Object.keys(JSON.parse(result.stdout).platforms)).toEqual(['ios']);
  });

  it('emits one cli:config_effective event with counts and no values', async () => {
    const { projectRoot, env } = await setupAsync('go-app');
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    await executeExagentAsync(projectRoot, ['config:effective', '--json'], {
      env: { ...env, LOG_EVENTS: eventsFile },
    });

    const raw = fs.readFileSync(eventsFile, 'utf8');
    // `2g` names the event in the `_e` field of every JSONL line.
    const event = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .find((entry) => entry._e === 'cli:config_effective');

    expect(event).toMatchObject({
      configuredSdkVersion: '54.0.0',
      platforms: ['ios', 'android'],
      modCounts: { ios: 2, android: 2 },
      pluginCount: 2,
      declaredPluginCount: 1,
      autolinkedModuleCount: 2,
    });
    // Counts only: a config carries bundle identifiers and permission strings.
    expect(raw).not.toContain('NSCameraUsageDescription');
  });

  it('suppresses the follow-ups on request', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const withFollowups = await executeExagentAsync(projectRoot, ['config:effective'], { env });
    const without = await executeExagentAsync(projectRoot, ['config:effective', '--no-followups'], {
      env,
    });

    expect(withFollowups.stdout).toContain('config:effective --file infoPlist');
    expect(without.stdout).not.toContain('config:effective --file infoPlist');
  });

  describe('failures', () => {
    // `_internal` is documented output, not a public API, so a payload without it is answered
    // rather than crashed on.
    it('reports a config with no introspected results, and exits 1', async () => {
      const { projectRoot, env } = await setupAsync('go-app', {
        name: 'go-app',
        slug: 'go-app',
        sdkVersion: '54.0.0',
      });

      const result = await executeExagentAsync(projectRoot, ['config:effective'], {
        env,
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('no introspected native results');
      expect(result.all).toContain('Try: npx expo config --type introspect --json');
    });

    it('reports a failed expo CLI in the words the CLI used, and exits 1', async () => {
      const { projectRoot, env } = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['config:effective'], {
        env: { ...env, STUB_EXPO_EXIT_CODE: '3' },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('expo config exited with code 3');
    });

    it('rejects a --file that names no native file, without running expo', async () => {
      const { projectRoot, env } = await setupAsync('go-app');

      const result = await executeExagentAsync(
        projectRoot,
        ['config:effective', '--file', 'AndroidManifest.xml'],
        { env, reject: false }
      );

      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('names no native file');
      // A typo must not cost the caller a config evaluation.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });

  it('prints its own help, naming the colon form', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config:effective', '--help'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('npx exagent config:effective');
    expect(result.stdout).toContain('--platform <ios|android|all>');
    expect(result.stdout).toContain('--file <name>');
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });
});

// @ref llp/0010-agent-conventions.rfc.md §Registry rules, rule (b). The unit test pins the
// resolution; this pins what the process boundary shows, which is the thing that would actually
// break for a user: `exagent config` reaching `expo config`.
describe('exagent config (bare)', () => {
  it('still forwards to expo config, group or no group', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config', '--type', 'public'], { env });

    expect(result.exitCode).toBe(0);
    expect(readStubExpoInvocations(projectRoot).map((invocation) => invocation.args)).toEqual([
      ['config', '--type', 'public'],
    ]);
  });

  // The documented cost of the rule: the space form is the bare form with an argument, and the
  // bare form is `expo config`, which takes a positional directory.
  it('forwards the space form rather than resolving it', async () => {
    const { projectRoot, env } = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['config', 'effective'], { env });

    expect(result.exitCode).toBe(0);
    expect(readStubExpoInvocations(projectRoot).map((invocation) => invocation.args)).toEqual([
      ['config', 'effective'],
    ]);
  });
});
