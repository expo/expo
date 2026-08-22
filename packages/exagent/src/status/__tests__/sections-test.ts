import type { LastBuildFingerprints } from '../../plan/types';
import type { ProjectState } from '../../project/types';
import type { DevServerProbe } from '../../runtime/devServer';
import {
  buildDevServerStatus,
  buildExpoGoStatus,
  buildFreshnessStatus,
  buildNextActionStatus,
  buildProjectStatus,
  resolveDefaultPlatform,
} from '../sections';

const projectRoot = '/project';

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: false,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abcdef0123456789' },
    ...overrides,
  };
}

const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(buildProjectStatus, () => {
  it(`should report the package name, the SDK version and a CNG project`, () => {
    expect(buildProjectStatus(mockState(), 'my-app')).toEqual({
      root: projectRoot,
      name: 'my-app',
      sdkVersion: '54.0.0',
      native: 'cng',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: false,
    });
  });

  it(`should fall back to the directory name when the package has no name`, () => {
    expect(buildProjectStatus(mockState(), null).name).toBe('project');
  });

  it(`should report a checked-in native directory as a bare project`, () => {
    const status = buildProjectStatus(
      mockState({ nativeDirs: { ios: true, android: false } }),
      'my-app'
    );

    expect(status.native).toBe('bare');
    expect(status.nativeDirs).toEqual({ ios: true, android: false });
  });

  it(`should report the dev client and web dependencies`, () => {
    const status = buildProjectStatus(mockState({ usesDevClient: true, hasWeb: true }), 'my-app');

    expect(status.usesDevClient).toBe(true);
    expect(status.hasWeb).toBe(true);
  });

  it(`should report an unknown SDK version instead of failing`, () => {
    expect(buildProjectStatus(mockState({ sdkVersion: null }), 'my-app').sdkVersion).toBeNull();
  });
});

describe(buildExpoGoStatus, () => {
  it(`should report a compatible project without reasons`, () => {
    expect(buildExpoGoStatus(mockState())).toEqual({ compatible: true, reasonCount: 0 });
  });

  it(`should count the reasons a project cannot run in Expo Go`, () => {
    const state = mockState({
      expoGo: {
        compatible: false,
        reasons: [
          { kind: 'unbundled-native-module', packageName: 'react-native-fancy', detail: 'native' },
          { kind: 'config-plugin', packageName: 'expo-build-properties', detail: 'plugin' },
        ],
      },
    });

    // The count is the summary; the reasons themselves ride along in the report's `probe`.
    expect(buildExpoGoStatus(state)).toEqual({ compatible: false, reasonCount: 2 });
  });
});

describe(buildFreshnessStatus, () => {
  it(`should report both platforms as unknown when there is no fingerprint`, () => {
    const state = mockState({ fingerprint: { hash: null, error: 'fingerprint CLI not found' } });

    const status = buildFreshnessStatus(state, {});

    expect(status.hash).toBeNull();
    expect(status.error).toBe('fingerprint CLI not found');
    expect(status.platforms.map((platform) => platform.state)).toEqual(['unknown', 'unknown']);
  });

  it(`should report a platform without a recorded build as stale`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    expect(status.platforms).toEqual([
      { platform: 'ios', state: 'stale', detail: 'no recorded build', recordedHash: null },
      { platform: 'android', state: 'stale', detail: 'no recorded build', recordedHash: null },
    ]);
  });

  it(`should report a platform whose recorded build matches as fresh`, () => {
    const lastBuild: LastBuildFingerprints = { ios: 'abcdef0123456789' };

    const status = buildFreshnessStatus(mockState(), lastBuild);

    expect(status.platforms[0]).toEqual({
      platform: 'ios',
      state: 'fresh',
      detail: 'matches abcdef01',
      recordedHash: 'abcdef0123456789',
    });
    // Only the platform with a record can be proven fresh.
    expect(status.platforms[1]!.state).toBe('stale');
  });

  it(`should report a platform whose recorded build differs as stale`, () => {
    const status = buildFreshnessStatus(mockState(), { android: '99999999deadbeef' });

    const android = status.platforms[1]!;
    expect(android.state).toBe('stale');
    expect(android.detail).toContain('99999999');
    expect(android.recordedHash).toBe('99999999deadbeef');
  });

  it(`should report the fingerprint hash it compared against`, () => {
    expect(buildFreshnessStatus(mockState(), {}).hash).toBe('abcdef0123456789');
  });
});

describe(buildDevServerStatus, () => {
  const url = 'http://127.0.0.1:8081';

  it(`should report a reachable dev server and the apps connected to it`, () => {
    const probe = { reachable: true, targets: [{ id: '1' }, { id: '2' }] } as DevServerProbe;

    expect(buildDevServerStatus(url, probe)).toEqual({
      url,
      running: true,
      appsConnected: 2,
    });
  });

  it(`should report a dev server without a connected app`, () => {
    const probe: DevServerProbe = { reachable: true, targets: [] };

    expect(buildDevServerStatus(url, probe)).toEqual({ url, running: true, appsConnected: 0 });
  });

  it(`should report an unreachable dev server with its reason`, () => {
    const probe: DevServerProbe = { reachable: false, targets: [], reason: 'fetch failed' };

    expect(buildDevServerStatus(url, probe)).toEqual({
      url,
      running: false,
      appsConnected: 0,
      reason: 'fetch failed',
    });
  });
});

describe(buildNextActionStatus, () => {
  it(`should report the Expo Go rule and the command that runs it`, () => {
    const next = buildNextActionStatus(mockState(), {}, 'ios');

    expect(next.command).toBe('exagent dev');
    expect(next.rule).toBe('expo-go');
    expect(next.target).toBe('expo-go');
    expect(next.steps[0]!.argv).toEqual(['expo', 'start', '--go']);
  });

  it(`should report the whole plan of a project that needs a build`, () => {
    const state = mockState({
      usesDevClient: true,
      expoGo: { compatible: false, reasons: [] },
    });

    const next = buildNextActionStatus(state, {}, 'android');

    expect(next.rule).toBe('dev-client-stale');
    expect(next.steps.map((step) => step.argv.join(' '))).toEqual([
      'expo prebuild --platform android',
      'expo run:android',
    ]);
  });

  it(`should report the fresh rule when the recorded build matches`, () => {
    const state = mockState({ usesDevClient: true, expoGo: { compatible: false, reasons: [] } });

    const next = buildNextActionStatus(state, { ios: 'abcdef0123456789' }, 'ios');

    expect(next.rule).toBe('dev-client-fresh');
    expect(next.steps).toHaveLength(1);
  });

  it(`should target the platform it is given`, () => {
    const next = buildNextActionStatus(mockState({ hasWeb: true }), {}, 'web');

    expect(next.rule).toBe('web');
    expect(next.steps[0]!.argv).toEqual(['expo', 'start', '--web']);
  });
});

describe(resolveDefaultPlatform, () => {
  it(`should let a single checked-in native directory decide`, () => {
    expect(resolveDefaultPlatform(mockState({ nativeDirs: { ios: false, android: true } }))).toBe(
      'android'
    );
    expect(resolveDefaultPlatform(mockState({ nativeDirs: { ios: true, android: false } }))).toBe(
      'ios'
    );
  });

  it(`should target iOS on macOS when the project has no native directories`, () => {
    mockPlatform('darwin');

    expect(resolveDefaultPlatform(mockState())).toBe('ios');
  });

  it(`should target Android on a host that cannot build for iOS`, () => {
    mockPlatform('linux');

    expect(resolveDefaultPlatform(mockState())).toBe('android');
  });
});
