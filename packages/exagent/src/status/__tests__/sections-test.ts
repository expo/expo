import * as network from '../../followups/network';
import type { LastBuildFingerprints } from '../../plan/types';
import type { ProjectState } from '../../project/types';
import type { DevServerProbe } from '../../runtime/devServer';
import {
  applyEasFreshness,
  applyOpenUrls,
  buildDevServerStatus,
  buildExpoGoStatus,
  buildFreshnessStatus,
  buildLocalDeviceStatus,
  buildNextActionStatus,
  buildProjectStatus,
  effectivePlatformFreshness,
  resolveDefaultPlatform,
  type DevServerReadiness,
} from '../sections';
import type {
  DevServerStatus,
  FreshnessStatus,
  LocalDeviceStatus,
  PlatformBuild,
} from '../types';

const projectRoot = '/project';

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot,
    isExpoApp: true,
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
      isExpoApp: true,
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
  /** The entry for one axis, which is what every assertion below is about. */
  function axis(status: FreshnessStatus, platform: 'ios' | 'android', backend: 'local' | 'eas') {
    return status.platforms.find(
      (entry) => entry.platform === platform && entry.backend === backend
    )!;
  }

  // @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
  it(`should carry where the hash came from`, () => {
    const status = buildFreshnessStatus(
      mockState({
        fingerprint: {
          hash: 'abcdef0123456789',
          source: 'cache',
          revalidatedAgainst: 7,
          computedAt: '2026-08-27T09:00:00.000Z',
          cacheCaveats: ['the contents of node_modules'],
        },
      }),
      {}
    );

    expect(status.hashSource).toEqual({
      source: 'cache',
      revalidatedAgainst: 7,
      computedAt: '2026-08-27T09:00:00.000Z',
      caveats: ['the contents of node_modules'],
    });
  });

  it(`should carry no caveats for a hash it measured`, () => {
    const status = buildFreshnessStatus(
      mockState({
        // A `computed` result carries no revalidation, and its caveats are about a cache that did
        // not answer — so they must not reach a report about a measurement.
        fingerprint: { hash: 'abcdef0123456789', source: 'computed' },
      }),
      {}
    );

    expect(status.hashSource).toEqual({
      source: 'computed',
      revalidatedAgainst: null,
      computedAt: null,
      caveats: [],
    });
  });

  // @ref llp/0021-honest-reports.rfc.md §Freshness has two axes — K7(d). Backend × platform.
  it(`should report one entry per backend per platform`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    expect(status.platforms.map((entry) => `${entry.platform} ${entry.backend}`)).toEqual([
      'ios local',
      'ios eas',
      'android local',
      'android eas',
    ]);
  });

  // `unknown`, never `stale`: the whole finding is that "this machine has no record" was reported
  // as the answer to a question about EAS.
  it(`should report the eas axis as unasked until something asks`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    expect(axis(status, 'ios', 'eas')).toMatchObject({
      state: 'unknown',
      detail: expect.stringContaining('--explain'),
      buildId: null,
      impact: null,
    });
  });

  it(`should report both platforms as unknown when there is no fingerprint`, () => {
    const state = mockState({ fingerprint: { hash: null, error: 'fingerprint CLI not found' } });

    const status = buildFreshnessStatus(state, {});

    expect(status.hash).toBeNull();
    expect(status.error).toBe('fingerprint CLI not found');
    expect(status.platforms.map((platform) => platform.state)).toEqual([
      'unknown',
      'unknown',
      'unknown',
      'unknown',
    ]);
  });

  it(`should report a platform without a recorded build as stale`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    expect(axis(status, 'ios', 'local')).toMatchObject({
      state: 'stale',
      detail: 'no recorded build',
      recordedHash: null,
    });
    expect(axis(status, 'android', 'local')).toMatchObject({
      state: 'stale',
      detail: 'no recorded build',
    });
    // Nothing to compare against is not a class. See llp/0011 §Two commands, one classifier.
    expect(axis(status, 'ios', 'local').impact).toMatchObject({
      class: null,
      reason: expect.stringContaining('no build is recorded for ios'),
    });
  });

  it(`should report a platform whose recorded build matches as fresh`, () => {
    const lastBuild: LastBuildFingerprints = { ios: 'abcdef0123456789' };

    const status = buildFreshnessStatus(mockState(), lastBuild);

    expect(axis(status, 'ios', 'local')).toMatchObject({
      platform: 'ios',
      backend: 'local' as const,
      buildId: null,
      buildProfile: null,
      state: 'fresh',
      detail: 'matches abcdef01',
      recordedHash: 'abcdef0123456789',
    });
    // Only the platform with a record can be proven fresh.
    expect(axis(status, 'android', 'local').state).toBe('stale');
  });

  it(`should report a platform whose recorded build differs as stale`, () => {
    const status = buildFreshnessStatus(mockState(), { android: '99999999deadbeef' });

    const android = axis(status, 'android', 'local');
    expect(android.state).toBe('stale');
    expect(android.detail).toContain('99999999');
    expect(android.recordedHash).toBe('99999999deadbeef');
  });

  it(`should report the fingerprint hash it compared against`, () => {
    expect(buildFreshnessStatus(mockState(), {}).hash).toBe('abcdef0123456789');
  });
});

// @ref llp/0021-honest-reports.rfc.md §Freshness has two axes — K7(b). A development-simulator
// build whose fingerprint matches is the case the old report called "stale (no recorded build)".
describe(applyEasFreshness, () => {
  function easBuild(overrides: Partial<PlatformBuild> = {}): PlatformBuild {
    return {
      platform: 'ios',
      state: 'found',
      fingerprintHash: 'abcdef0123456789',
      buildId: '21d7d434-6495-4e74-b8c7-68ecd0dff489',
      createdAt: '2026-08-19T17:37:12.674Z',
      buildProfile: 'simulator',
      buildUrl: 'https://expo.dev/artifacts/eas/x.tar.gz',
      source: 'eas',
      reason: null,
      ...overrides,
    };
  }

  it(`should report a matching EAS build as fresh, and name it`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    applyEasFreshness(status, { askedEas: true, platforms: [easBuild()] });

    const entry = status.platforms.find(
      (one) => one.platform === 'ios' && one.backend === 'eas'
    )!;
    expect(entry.state).toBe('fresh');
    expect(entry.buildId).toBe('21d7d434-6495-4e74-b8c7-68ecd0dff489');
    expect(entry.detail).toContain('simulator build');
    // The local axis is untouched: this machine still has no record, and that is also true.
    expect(status.platforms.find((one) => one.platform === 'ios' && one.backend === 'local')!.state).toBe(
      'stale'
    );
  });

  it(`should report an EAS that has no such build as stale on that axis`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    applyEasFreshness(status, {
      askedEas: true,
      platforms: [easBuild({ state: 'none', buildId: null, buildProfile: null })],
    });

    expect(
      status.platforms.find((one) => one.platform === 'ios' && one.backend === 'eas')
    ).toMatchObject({ state: 'stale', detail: expect.stringContaining('no finished build') });
  });

  it(`should keep the reason of a lookup that could not answer`, () => {
    const status = buildFreshnessStatus(mockState(), {});

    applyEasFreshness(status, {
      askedEas: true,
      platforms: [easBuild({ state: 'unknown', buildId: null, reason: 'not signed in' })],
    });

    expect(
      status.platforms.find((one) => one.platform === 'ios' && one.backend === 'eas')
    ).toMatchObject({ state: 'unknown', detail: 'not signed in' });
  });

  it(`should leave an axis a --build comparison already claimed`, () => {
    const status = buildFreshnessStatus(mockState(), {});
    const entry = status.platforms.find(
      (one) => one.platform === 'ios' && one.backend === 'eas'
    )!;
    entry.impact = {
      class: 'js-only',
      fingerprintChanged: false,
      reason: 'the named build matches',
      changedCount: null,
      changedSources: null,
    };
    entry.state = 'fresh';
    entry.detail = 'matches EAS build abc123';

    applyEasFreshness(status, {
      askedEas: true,
      platforms: [easBuild({ state: 'none', buildId: null })],
    });

    expect(entry.detail).toBe('matches EAS build abc123');
  });
});

describe(effectivePlatformFreshness, () => {
  it(`should answer with the freshest axis, whichever it is`, () => {
    const status = buildFreshnessStatus(mockState(), {});
    applyEasFreshness(status, {
      askedEas: true,
      platforms: [
        {
          platform: 'ios',
          state: 'found',
          fingerprintHash: 'abcdef0123456789',
          buildId: 'build-1',
          createdAt: null,
          buildProfile: 'simulator',
          buildUrl: null,
          source: 'eas',
          reason: null,
        },
      ],
    });

    // Local says stale, EAS says fresh: a finished build that matches answers "does this need a
    // native build" whichever place the build is (K7(b)).
    expect(effectivePlatformFreshness(status, 'ios')).toMatchObject({
      backend: 'eas',
      state: 'fresh',
    });
    expect(effectivePlatformFreshness(status, 'android')).toMatchObject({
      backend: 'local',
      state: 'stale',
    });
  });

  it(`should answer null for a platform nothing reported`, () => {
    expect(effectivePlatformFreshness(null, 'ios')).toBeNull();
  });
});

describe(buildDevServerStatus, () => {
  const url = 'http://127.0.0.1:8081';
  const readiness: DevServerReadiness = {
    source: 'default',
    ready: true,
    projectRootMatched: true,
  };

  it(`should report a reachable dev server and the apps connected to it`, () => {
    const probe = { reachable: true, targets: [{ id: '1' }, { id: '2' }] } as DevServerProbe;

    expect(buildDevServerStatus(url, probe, readiness)).toEqual({
      url,
      running: true,
      appsConnected: 2,
      appsListed: 2,
      appsStale: 0,
      source: 'default',
      ready: true,
      projectRootMatched: true,
      hostType: null,
      tunnelUrl: null,
      openUrls: [],
    });
  });

  it(`should report a dev server without a connected app`, () => {
    const probe: DevServerProbe = { reachable: true, targets: [] };

    expect(buildDevServerStatus(url, probe, readiness)).toEqual({
      url,
      running: true,
      appsConnected: 0,
      appsListed: 0,
      appsStale: 0,
      source: 'default',
      ready: true,
      projectRootMatched: true,
      hostType: null,
      tunnelUrl: null,
      openUrls: [],
    });
  });

  it(`should report an unreachable dev server with its reason`, () => {
    const probe: DevServerProbe = { reachable: false, targets: [], reason: 'fetch failed' };

    expect(
      buildDevServerStatus(url, probe, { source: 'default', ready: null, projectRootMatched: null })
    ).toEqual({
      url,
      running: false,
      appsConnected: 0,
      appsListed: 0,
      appsStale: 0,
      source: 'default',
      ready: null,
      projectRootMatched: null,
      hostType: null,
      tunnelUrl: null,
      openUrls: [],
      reason: 'fetch failed',
    });
  });

  // The step that answered is part of the report: `flag` and `lock` name a dev server on purpose,
  // `scan` only found one that answered (llp/0010 §Registry rules is about names; this is about
  // how much a discovered URL proves).
  it(`should carry the discovery step through`, () => {
    const probe: DevServerProbe = { reachable: true, targets: [] };

    expect(
      buildDevServerStatus(url, probe, { source: 'scan', ready: false, projectRootMatched: false })
    ).toMatchObject({ source: 'scan', ready: false, projectRootMatched: false });
  });
});

describe(buildNextActionStatus, () => {
  // @ref llp/0020-not-an-expo-app.rfc.md §What each command does
  // `status` answers here rather than refusing, so its `next` line is the one place the trap could
  // survive: `exagent dev` in a directory that is not an Expo app is exactly what `dev` now stops.
  it(`should not name exagent dev for a directory that is not an Expo app`, () => {
    const next = buildNextActionStatus(mockState({ isExpoApp: false }), {}, 'ios', null);

    expect(next.command).not.toBe('exagent dev');
    expect(next.rule).toBe('not-expo-app');
    expect(next.target).toBe('none');
    expect(next.steps).toEqual([]);
    expect(next.buildLocation).toBeNull();
    expect(next.why).toContain('not an Expo app');
  });

  it(`should say so even when a dev server this project could use is answering`, () => {
    const next = buildNextActionStatus(mockState({ isExpoApp: false }), {}, 'ios', {
      url: 'http://127.0.0.1:8081',
      running: true,
      appsConnected: 1,
      appsListed: 1,
      appsStale: 0,
      source: 'lock',
      ready: true,
      projectRootMatched: true,
      hostType: null,
      tunnelUrl: null,
      openUrls: [],
    });

    expect(next.rule).toBe('not-expo-app');
    expect(next.steps).toEqual([]);
  });

  it(`should report the Expo Go rule and the command that runs it`, () => {
    const next = buildNextActionStatus(mockState(), {}, 'ios', null);

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

    const next = buildNextActionStatus(state, {}, 'android', null);

    expect(next.rule).toBe('dev-client-stale');
    expect(next.steps.map((step) => step.argv.join(' '))).toEqual([
      'expo prebuild --platform android',
      'expo run:android',
    ]);
  });

  it(`should report the fresh rule when the recorded build matches`, () => {
    const state = mockState({ usesDevClient: true, expoGo: { compatible: false, reasons: [] } });

    const next = buildNextActionStatus(state, { ios: 'abcdef0123456789' }, 'ios', null);

    expect(next.rule).toBe('dev-client-fresh');
    expect(next.steps).toHaveLength(1);
  });

  it(`should target the platform it is given`, () => {
    const next = buildNextActionStatus(mockState({ hasWeb: true }), {}, 'web', null);

    expect(next.rule).toBe('web');
    expect(next.steps[0]!.argv).toEqual(['expo', 'start', '--web']);
  });

  // The report used to name a running dev server three lines above a `next` that said to start
  // one. Two lines of the same report contradicting each other is worse than either being wrong.
  describe('with a dev server already answering', () => {
    function devServerStatus(overrides: Partial<DevServerStatus> = {}): DevServerStatus {
      return {
        url: 'http://127.0.0.1:8099',
        running: true,
        appsConnected: 0,
        appsListed: 0,
        appsStale: 0,
        source: 'lock',
        ready: true,
        projectRootMatched: true,
        hostType: null,
        tunnelUrl: null,
        openUrls: [],
        ...overrides,
      };
    }

    // @ref llp/0009-smart-followups.rfc.md §Examples per command — friction run 5, F48-8. A wait
    // for an app to attach cannot succeed while nothing is opening one: `--require-app` polls the
    // debugger target list, and no command in this CLI puts an app in it except this one. The
    // honest next action is the one that changes the state the wait is waiting for.
    it(`should send a matched server with no app to the command that opens one`, () => {
      const next = buildNextActionStatus(mockState(), {}, 'ios', devServerStatus());

      expect(next.command).toBe('exagent navigate /');
      expect(next.why).toContain('no app is connected');
      // The project's own shape does not change because a server is up.
      expect(next.rule).toBe('expo-go');
      expect(next.steps).toEqual([]);
    });

    // Still the gate and not `runtime:errors`, which the follow-ups already name: the gate is the
    // only command that proves the bundle compiles, and `next` must not repeat a follow-up.
    it(`should send a matched server with an app to the gate too`, () => {
      const next = buildNextActionStatus(
        mockState(),
        {},
        'ios',
        devServerStatus({ appsConnected: 1 })
      );

      expect(next.command).toBe('exagent smoke');
      expect(next.why).toContain('app connected');
    });

    // Undecidable is not a mismatch: a dev server that named no project root is still the only one
    // there is, and starting a second would collide with it.
    it(`should still verify when the match could not be decided`, () => {
      const next = buildNextActionStatus(
        mockState(),
        {},
        'ios',
        // With an app attached, so this isolates the match decision from the app-count branch.
        devServerStatus({ projectRootMatched: null, appsConnected: 1 })
      );

      expect(next.command).toBe('exagent smoke');
    });

    it(`should keep the plan for another project's dev server`, () => {
      const next = buildNextActionStatus(
        mockState(),
        {},
        'ios',
        devServerStatus({ projectRootMatched: false, appsConnected: 1 })
      );

      expect(next.command).toBe('exagent dev');
      expect(next.why).toBeNull();
      expect(next.steps[0]!.argv).toEqual(['expo', 'start', '--go']);
    });

    // @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
    //
    // `exagent navigate /` drives a **local** simulator or an attached device. A dogfood session
    // drove Expo Go on a *cloud* simulator through a tunnel, from a machine with neither, and this
    // line told it to run `navigate` for two hours [observed — 2026-08-24].
    describe('with no local device to open the app on', () => {
      const absent: LocalDeviceStatus = {
        state: 'absent',
        platform: null,
        deviceId: null,
        name: null,
        reason: 'no booted iOS simulator was found',
      };

      // `clearMocks` empties the calls but keeps the implementation, and this host's real LAN
      // address must not leak into the next test.
      afterEach(() => jest.restoreAllMocks());

      it(`names the tunnel URL instead of a command that needs a device`, () => {
        const next = buildNextActionStatus(
          mockState(),
          {},
          'ios',
          devServerStatus({ hostType: 'tunnel', tunnelUrl: 'http://abc.boltexpo.dev' }),
          absent
        );

        expect(next.command).toBe('exp://abc.boltexpo.dev');
        expect(next.why).toContain('no booted simulator or attached device');
        expect(next.why).toContain('tunnel host');
      });

      it(`names this host's LAN URL when the run has no tunnel`, () => {
        jest.spyOn(network, 'resolveLanHost').mockReturnValue('192.168.1.233');

        const next = buildNextActionStatus(mockState(), {}, 'ios', devServerStatus(), absent);

        expect(next.command).toBe('exp://192.168.1.233:8099');
        expect(next.why).toContain('local network');
      });

      // No LAN address, so there is no URL this report can vouch for — and the command that can
      // work one out needs no device either.
      it(`falls back to the mode that resolves a URL without a device`, () => {
        jest.spyOn(network, 'resolveLanHost').mockReturnValue(null);

        const next = buildNextActionStatus(mockState(), {}, 'ios', devServerStatus(), absent);

        expect(next.command).toBe('exagent navigate / --print-url');
      });

      // @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
      // `exp://` is the Expo Go form only. A development build opens its own scheme, and the URL
      // that points it at a dev server is the dev launcher's own shape.
      it(`names the app's own scheme for a development build`, () => {
        const next = buildNextActionStatus(
          mockState({ usesDevClient: true }),
          {},
          'ios',
          devServerStatus({ hostType: 'tunnel', tunnelUrl: 'http://abc.boltexpo.dev' }),
          absent,
          'myapp'
        );

        expect(next.command).toBe(
          'myapp://expo-development-client/?url=https%3A%2F%2Fabc.boltexpo.dev'
        );
        expect(next.why).toContain('development build');
      });

      // A project whose scheme cannot be read statically — a dynamic `app.config.js` — has no
      // development-build URL this report can name, and the command that can be given `--scheme` is
      // the honest answer.
      it(`hands a development build with no readable scheme to the print-url command`, () => {
        const next = buildNextActionStatus(
          mockState({ usesDevClient: true }),
          {},
          'ios',
          devServerStatus({ hostType: 'tunnel', tunnelUrl: 'http://abc.boltexpo.dev' }),
          absent,
          null
        );

        expect(next.command).toBe('exagent navigate / --print-url');
      });

      // Two applications could be meant, and one line cannot carry a labelled pair.
      it(`names the command that prints both when nothing established which app is running`, () => {
        const next = buildNextActionStatus(
          mockState({ nativeDirs: { ios: true, android: false } }),
          {},
          'ios',
          devServerStatus({ hostType: 'tunnel', tunnelUrl: 'http://abc.boltexpo.dev' }),
          absent,
          'myapp'
        );

        expect(next.command).toBe('exagent navigate / --print-url');
        expect(next.why).toContain('nothing established');
      });

      // The rule that keeps this from breaking a working machine: a probe that could not run
      // establishes nothing, so the ladder is left exactly as it was.
      it(`keeps navigate when the probe could not establish anything`, () => {
        const next = buildNextActionStatus(mockState(), {}, 'ios', devServerStatus(), {
          ...absent,
          state: 'unknown',
        });

        expect(next.command).toBe('exagent navigate /');
      });

      it(`keeps navigate when a device is there`, () => {
        const next = buildNextActionStatus(mockState(), {}, 'ios', devServerStatus(), {
          state: 'present',
          platform: 'ios',
          deviceId: 'SIM-1',
          name: 'iPhone 17',
          reason: null,
        });

        expect(next.command).toBe('exagent navigate /');
      });
    });

    it(`should keep the plan when nothing answered`, () => {
      const next = buildNextActionStatus(
        mockState(),
        {},
        'ios',
        devServerStatus({ running: false, ready: null })
      );

      expect(next.command).toBe('exagent dev');
      expect(next.why).toBeNull();
    });
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

describe(buildLocalDeviceStatus, () => {
  it(`names the device that was found`, () => {
    expect(
      buildLocalDeviceStatus({
        state: 'present',
        device: { backend: 'local-ios', platform: 'ios', deviceId: 'SIM-1', name: 'iPhone 17' },
        reason: null,
      })
    ).toEqual({
      state: 'present',
      platform: 'ios',
      deviceId: 'SIM-1',
      name: 'iPhone 17',
      reason: null,
    });
  });

  it(`carries the reason of a machine with none`, () => {
    expect(
      buildLocalDeviceStatus({ state: 'absent', device: null, reason: 'no booted iOS simulator' })
    ).toEqual({
      state: 'absent',
      platform: null,
      deviceId: null,
      name: null,
      reason: 'no booted iOS simulator',
    });
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
describe('buildNextActionStatus with a cloud session on record', () => {
  const devServer = {
    running: true,
    url: 'http://127.0.0.1:8081',
    source: 'lock',
    projectRootMatched: true,
    appsConnected: 0,
    tunnelUrl: 'https://abc.ngrok.app',
    openUrls: [],
    reason: null,
  } as never;

  const absentDevice = {
    state: 'absent',
    platform: null,
    deviceId: null,
    name: null,
    reason: 'none',
  } as never;

  /** The project shape the next-action rules read, from this file's own builder. */
  const state = mockState();

  // A session is a device this CLI can drive, so it outranks every URL below it: those are things
  // a person has to open somewhere else.
  it(`names the command that acts, rather than a URL for somebody to open`, () => {
    const next = buildNextActionStatus(
      state,
      {} as never,
      'ios',
      devServer,
      absentDevice,
      null,
      true
    );

    expect(next.command).toBe('exagent navigate / --cloud');
    expect(next.why).toContain('EAS Simulator session');
  });

  it(`falls back to the URL to open elsewhere when there is no session`, () => {
    const next = buildNextActionStatus(
      state,
      {} as never,
      'ios',
      devServer,
      absentDevice,
      null,
      false
    );

    expect(next.command).not.toContain('--cloud');
  });

  // @ref llp/0021-honest-reports.rfc.md §Advice for the device the loop is actually on — K7(a).
  // With a cloud app connected, this section answered `exagent smoke` — a command that looks for a
  // simulator on this machine, on a run whose device is in the cloud.
  it(`keeps the gate on the cloud when the app that is connected is there`, () => {
    const withApp = { ...(devServer as object), appsConnected: 1 } as never;

    const next = buildNextActionStatus(state, {} as never, 'ios', withApp, absentDevice, null, true);

    expect(next.command).toBe('exagent smoke --cloud');
    expect(next.why).toContain('EAS Simulator session');
  });

  it(`keeps the plain gate when the app is on this machine`, () => {
    const withApp = { ...(devServer as object), appsConnected: 1 } as never;
    const presentDevice = {
      state: 'present',
      platform: 'ios',
      deviceId: 'SIM-1',
      name: 'iPhone 17',
      reason: null,
    } as never;

    const next = buildNextActionStatus(
      state,
      {} as never,
      'ios',
      withApp,
      presentDevice,
      null,
      true
    );

    expect(next.command).toBe('exagent smoke');
  });

  // A probe that could not run is not evidence of a local device, and the caller has *told* this
  // project where its device is. `navigate /` on that machine opens nothing.
  it(`names the cloud when the device probe could not answer`, () => {
    const unknownDevice = {
      state: 'unknown',
      platform: null,
      deviceId: null,
      name: null,
      reason: 'no platform tool answered',
    } as never;

    const next = buildNextActionStatus(
      state,
      {} as never,
      'ios',
      devServer,
      unknownDevice,
      null,
      true
    );

    expect(next.command).toBe('exagent navigate / --cloud');
    expect(next.why).toContain('could not answer');
  });

  // Without a session there is nothing in the cloud to name, so an unanswered probe keeps the old
  // rung: this CLI has not been shown that there is no device here.
  it(`leaves the local rung alone when nothing named a cloud session`, () => {
    const unknownDevice = {
      state: 'unknown',
      platform: null,
      deviceId: null,
      name: null,
      reason: 'no platform tool answered',
    } as never;

    const next = buildNextActionStatus(
      state,
      {} as never,
      'ios',
      devServer,
      unknownDevice,
      null,
      false
    );

    expect(next.command).toBe('exagent navigate /');
  });
});

// @ref llp/0021-honest-reports.rfc.md §The scheme in "Waiting on" is not the dev server's — K7(c).
describe(applyOpenUrls, () => {
  const tunnelled: DevServerStatus = {
    url: 'http://127.0.0.1:8081',
    running: true,
    appsConnected: 0,
    appsListed: 0,
    appsStale: 0,
    source: 'lock',
    ready: true,
    projectRootMatched: true,
    hostType: 'tunnel',
    tunnelUrl: 'https://x8fj2.on.staging.expo.app',
    openUrls: [],
  };

  it(`builds the encoded launcher URL of a development build over the tunnel`, () => {
    const devServer = { ...tunnelled };

    applyOpenUrls(devServer, mockState({ usesDevClient: true }), 'exp+dailywords-grok');

    expect(devServer.openUrls).toEqual([
      {
        target: 'dev-build',
        label: 'development build',
        // https inside the parameter, because a tunnel terminates TLS — the same string
        // `UrlCreator.constructDevClientUrl` builds.
        url: 'exp+dailywords-grok://expo-development-client/?url=https%3A%2F%2Fx8fj2.on.staging.expo.app',
      },
    ]);
  });

  it(`leaves a dev server that is not running alone`, () => {
    const devServer = { ...tunnelled, running: false };

    applyOpenUrls(devServer, mockState(), 'exp+app');

    expect(devServer.openUrls).toEqual([]);
  });
});
