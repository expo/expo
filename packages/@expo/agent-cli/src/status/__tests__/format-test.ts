import { stripVTControlCharacters } from 'node:util';

import type { PlanBuildLocation } from '../../toolchain/types';
import { formatStatusReport } from '../format';
import type { FingerprintHashSource, FreshnessImpact, StatusReport } from '../types';
/**
 * A fingerprint this run measured, which is what every case here assumes unless it says otherwise.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
 */
const COMPUTED_FINGERPRINT: FingerprintHashSource = {
  source: 'computed',
  revalidatedAgainst: null,
  keyKind: null,
  computedAt: null,
  ageMs: null,
  caveats: [],
};

/** The report without color, so assertions never depend on the terminal's color support. */
function report(value: StatusReport): string {
  return stripVTControlCharacters(formatStatusReport(value));
}

function mockReport(overrides: Partial<StatusReport> = {}): StatusReport {
  return {
    project: {
      root: '/project',
      name: 'my-app',
      isExpoApp: true,
      sdkVersion: '54.0.0',
      native: 'cng',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: true,
    },
    expoGo: { compatible: true, reasonCount: 0 },
    freshness: {
      comparison: {
        kind: 'last-build' as const,
        label: 'last build recorded by @expo/agent-cli',
        buildId: null,
        platform: null,
      },
      changedFiles: null,
      hashSource: COMPUTED_FINGERPRINT,
      hash: 'abcdef0123456789',
      platforms: [
        {
          platform: 'ios',
          backend: 'local' as const,
          buildId: null,
          buildProfile: null,
          state: 'stale',
          detail: 'no recorded build',
          recordedHash: null,
          impact: null,
        },
        {
          platform: 'android',
          backend: 'local' as const,
          buildId: null,
          buildProfile: null,
          state: 'fresh',
          detail: 'matches abcdef01',
          recordedHash: 'abcdef0123456789',
          impact: null,
        },
      ],
      ota: null,
    },
    // The default run: nothing cached and EAS not asked, which prints no line at all.
    builds: { askedEas: false, platforms: [] },
    devServer: {
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
    },
    device: {
      state: 'present',
      platform: 'ios',
      deviceId: 'SIM-1',
      name: 'iPhone 17',
      devices: [{ platform: 'ios', deviceId: 'SIM-1', name: 'iPhone 17' }],
      reason: null,
    },
    skills: { agentIds: ['claude-code'], discovered: 3, linked: 3 },
    auth: { loggedIn: true, user: 'alice', source: 'eas whoami' },
    next: {
      command: 'npx @expo/agent-cli dev',
      rule: 'expo-go',
      target: 'expo-go',
      why: null,
      buildLocation: null,
      steps: [
        {
          id: 'start',
          argv: ['expo', 'start', '--go'],
          reason: 'Opens the project in Expo Go.',
          timeClass: 'seconds',
          runsOn: null,
        },
      ],
    },
    assertion: null,
    // The text report never prints the raw probe, so it is null here on purpose.
    probe: null,
    errors: {},
    ...overrides,
  };
}

/** The line of the report that starts with a label. */
function line(value: StatusReport, label: string): string {
  const found = report(value)
    .split('\n')
    .find((text) => text.startsWith(label));
  if (found == null) {
    throw new Error(`No "${label}" line in:\n${report(value)}`);
  }
  return found;
}

describe(formatStatusReport, () => {
  it(`should print one line per section, like git status`, () => {
    const lines = report(mockReport()).split('\n');

    // Nine, not eight: the freshness section is one line **per platform** now, because it carries
    // two backends per platform (llp/0021 §The rules).
    expect(lines).toHaveLength(9);
    expect(lines.map((text) => text.split(/\s{2,}/)[0])).toEqual([
      'project',
      'expo go',
      'freshness',
      // The continuation line of the freshness block, which carries no label of its own.
      '',
      'dev server',
      'device',
      'skills',
      'auth',
      'next',
    ]);
  });

  // Who the CLI family acts as, so an agent knows before a long command whether it will stop on a
  // login (llp/0010 §Needs-human protocol).
  describe('the auth line', () => {
    it(`should name the account and what said so`, () => {
      expect(line(mockReport(), 'auth')).toContain('alice');
      expect(line(mockReport(), 'auth')).toContain('eas whoami');
    });

    it(`should say "signed in" for an account nothing named`, () => {
      const value = mockReport({
        auth: { loggedIn: true, user: null, source: 'EXPO_TOKEN' },
      });

      expect(line(value, 'auth')).toContain('signed in');
      expect(line(value, 'auth')).toContain('EXPO_TOKEN');
    });

    it(`should report a signed-out machine as signed out`, () => {
      const value = mockReport({ auth: { loggedIn: false, user: null, source: 'eas whoami' } });

      expect(line(value, 'auth')).toContain('not signed in');
    });

    // Never rounded down to "signed out": the two lead to different next actions.
    it(`should keep "unknown" apart from "not signed in"`, () => {
      const value = mockReport({ auth: { loggedIn: null, user: null, source: null } });

      expect(line(value, 'auth')).toContain('unknown');
      expect(line(value, 'auth')).not.toContain('not signed in');
    });
  });

  it(`should summarize a managed project on the project line`, () => {
    expect(line(mockReport(), 'project')).toContain('my-app');
    expect(line(mockReport(), 'project')).toContain('SDK 54.0.0');
    expect(line(mockReport(), 'project')).toContain('CNG');
    expect(line(mockReport(), 'project')).toContain('no dev client');
    expect(line(mockReport(), 'project')).toContain('web');
  });

  it(`should name the checked-in native directories of a bare project`, () => {
    const report = mockReport({
      project: {
        ...mockReport().project!,
        native: 'bare',
        nativeDirs: { ios: true, android: true },
        usesDevClient: true,
        hasWeb: false,
      },
    });

    expect(line(report, 'project')).toContain('bare (ios, android)');
    expect(line(report, 'project')).toContain('dev client');
    expect(line(report, 'project')).toContain('no web');
  });

  it(`should print an unknown SDK version instead of nothing`, () => {
    const report = mockReport({ project: { ...mockReport().project!, sdkVersion: null } });

    expect(line(report, 'project')).toContain('SDK unknown');
  });

  it(`should print the Expo Go verdict with the number of reasons`, () => {
    expect(line(mockReport(), 'expo go')).toContain('compatible');

    const report = mockReport({ expoGo: { compatible: false, reasonCount: 2 } });
    expect(line(report, 'expo go')).toContain('not compatible (2 reasons)');
  });

  it(`should print a single Expo Go reason in the singular`, () => {
    const report = mockReport({ expoGo: { compatible: false, reasonCount: 1 } });

    expect(line(report, 'expo go')).toContain('(1 reason)');
  });

  // @ref llp/0021-honest-reports.rfc.md §The rules — K7(d). One line per platform,
  // one entry per backend, because the two answers disagree routinely and the disagreement is the
  // answer: `stale (no recorded build)` beside a matching EAS build is what sent the cloud loop
  // looking for a build it already had.
  it(`should print the freshness of every platform per backend`, () => {
    const rendered = report(mockReport());

    expect(rendered).toContain('ios      local stale (no recorded build)');
    expect(rendered).toContain('android  local fresh (matches abcdef01)');
  });

  it(`should print both axes of a platform on its own line`, () => {
    const base = mockReport();
    const rendered = report(
      mockReport({
        freshness: {
          ...base.freshness!,
          platforms: [
            base.freshness!.platforms[0]!,
            {
              platform: 'ios',
              backend: 'eas',
              state: 'fresh',
              detail: 'simulator build 21d7d434 matches this fingerprint',
              recordedHash: null,
              buildId: '21d7d434-6495-4e74-b8c7-68ecd0dff489',
              buildProfile: 'simulator',
              impact: null,
            },
          ],
        },
      })
    );

    const iosLine = rendered.split('\n').find((text) => text.includes('ios      '))!;
    expect(iosLine).toContain('local stale');
    expect(iosLine).toContain('eas fresh');
    expect(iosLine).toContain('simulator build 21d7d434');
  });

  // @ref llp/0024-cli-ui.rfc.md §The template
  // "EAS was not asked — pass --explain" is a fact about the run, and it was on the ios row and
  // again on the android row. A report whose whole shape is one fact per line cannot say the same
  // sentence twice and still be scannable.
  it(`should say a detail every platform shares once, under the rows`, () => {
    const base = mockReport();
    const asked = 'EAS was not asked — pass --explain';
    const rendered = report(
      mockReport({
        freshness: {
          ...base.freshness!,
          platforms: (['ios', 'android'] as const).map((platform) => ({
            platform,
            backend: 'eas' as const,
            state: 'unknown' as const,
            detail: asked,
            recordedHash: null,
            buildId: null,
            buildProfile: null,
            impact: null,
          })),
        },
      })
    );

    expect(rendered.split(asked)).toHaveLength(2);
    const iosLine = rendered.split('\n').find((text) => text.includes('ios      '))!;
    expect(iosLine).toContain('eas unknown');
    expect(iosLine).not.toContain(asked);
  });

  // The other half of the rule: a detail one platform has is what tells the two apart, so it stays
  // on that platform's row.
  it(`should keep a detail only one platform has on that platform's row`, () => {
    const rendered = report(mockReport());

    expect(rendered).toContain('ios      local stale (no recorded build)');
    expect(rendered).toContain('android  local fresh (matches abcdef01)');
  });

  // @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
  // @ref llp/0021-honest-reports.rfc.md
  describe('where the fingerprint came from', () => {
    function withHashSource(hashSource: FingerprintHashSource): string {
      return report(
        mockReport({
          freshness: {
            comparison: {
              kind: 'last-build' as const,
              label: 'last build recorded by @expo/agent-cli',
              buildId: null,
              platform: null,
            },
            changedFiles: null,
            hashSource,
            hash: 'abcdef0123456789',
            platforms: [],
            ota: null,
          },
        })
      );
    }

    it(`should say a cached hash was cached, by what check, and how old it is`, () => {
      const rendered = withHashSource({
        source: 'cache',
        revalidatedAgainst: 7,
        keyKind: 'mtime+size',
        computedAt: '2026-08-27T09:00:00.000Z',
        ageMs: 4 * 60 * 1000,
        caveats: [],
      });

      expect(rendered).toContain('fingerprint: abcdef01 (from cache');
      // The **kind** of check, not only the count: `mtime+size` is a stamp comparison and not a
      // content hash, and a reader about to skip a native build is entitled to know which.
      expect(rendered).toContain('revalidated by mtime+size of 7 files');
      // And the age, because it is the whole bound on what the stamps cannot see.
      expect(rendered).toContain('cached 4m ago');
      // The way out is on the line that makes the claim, so a reader who does not accept it does
      // not have to go looking for the flag.
      expect(rendered).toContain('--no-fingerprint-cache');
    });

    it(`should never claim a content hash it did not compute`, () => {
      const rendered = withHashSource({
        source: 'cache',
        revalidatedAgainst: 7,
        keyKind: 'mtime+size',
        computedAt: null,
        ageMs: 1000,
        caveats: [],
      });

      expect(rendered).not.toMatch(/hash of|content|sha/i);
    });

    it(`should print an age in seconds under a minute`, () => {
      expect(
        withHashSource({
          source: 'cache',
          revalidatedAgainst: 3,
          keyKind: 'mtime+size',
          computedAt: null,
          ageMs: 12_400,
          caveats: [],
        })
      ).toContain('cached 12s ago');
    });

    it(`should print an age over an hour in hours and minutes`, () => {
      expect(
        withHashSource({
          source: 'cache',
          revalidatedAgainst: 3,
          keyKind: 'mtime+size',
          computedAt: null,
          ageMs: 95 * 60 * 1000,
          caveats: [],
        })
      ).toContain('cached 1h35m ago');
    });

    it(`should say nothing at all about a hash it measured`, () => {
      const rendered = withHashSource({
        source: 'computed',
        revalidatedAgainst: null,
        keyKind: null,
        computedAt: null,
        ageMs: null,
        caveats: [],
      });

      expect(rendered).not.toContain('from cache');
      expect(rendered).not.toContain('--no-fingerprint-cache');
    });

    it(`should say nothing when nothing stated a source`, () => {
      const rendered = withHashSource({
        source: null,
        revalidatedAgainst: null,
        keyKind: null,
        computedAt: null,
        ageMs: null,
        caveats: [],
      });

      expect(rendered).not.toContain('from cache');
    });

    it(`should use the singular for one pinned file`, () => {
      expect(
        withHashSource({
          source: 'cache',
          revalidatedAgainst: 1,
          keyKind: 'mtime+size',
          computedAt: null,
          ageMs: 0,
          caveats: [],
        })
      ).toContain('revalidated by mtime+size of 1 file,');
    });
  });

  it(`should print the fingerprint error under the freshness block`, () => {
    const value = mockReport({
      freshness: {
        comparison: {
          kind: 'last-build' as const,
          label: 'last build recorded by @expo/agent-cli',
          buildId: null,
          platform: null,
        },
        changedFiles: null,
        hashSource: COMPUTED_FINGERPRINT,
        hash: null,
        error: 'fingerprint CLI not found\nInstall @expo/fingerprint',
        platforms: [
          {
            platform: 'ios',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'unknown',
            detail: 'no fingerprint tool',
            recordedHash: null,
            impact: null,
          },
          {
            platform: 'android',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'unknown',
            detail: 'no fingerprint tool',
            recordedHash: null,
            impact: null,
          },
        ],
        ota: null,
      },
    });

    const rendered = report(value);
    expect(rendered).toContain('unknown');
    // Under the platforms it explains, still one line whatever the error's own shape.
    expect(rendered).toContain('fingerprint CLI not found');
    expect(rendered).not.toContain('Install @expo/fingerprint');
  });

  it(`should keep a long fingerprint error on one line`, () => {
    const error = `The @expo/fingerprint CLI is not installed in this project, so the native surface cannot be hashed. Install it with "npx expo install @expo/fingerprint".`;
    const value = mockReport({
      freshness: {
        comparison: {
          kind: 'last-build' as const,
          label: 'last build recorded by @expo/agent-cli',
          buildId: null,
          platform: null,
        },
        changedFiles: null,
        hashSource: COMPUTED_FINGERPRINT,
        hash: null,
        error,
        platforms: [
          {
            platform: 'ios',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'unknown',
            detail: 'no fingerprint tool',
            recordedHash: null,
            impact: null,
          },
        ],
        ota: null,
      },
    });

    const rendered = report(value);
    expect(rendered).toContain('The @expo/fingerprint CLI is not installed');
    expect(rendered).toContain('…');
    // The full message is in the `--json` report, under `freshness` and `probe`.
    expect(rendered).not.toContain('npx expo install');
  });

  it(`should print the dev server, how it was found, its bundler and its connected apps`, () => {
    expect(line(mockReport(), 'dev server')).toBe(
      'dev server  running on http://127.0.0.1:8081 · via lock · bundler ready · 1 app connected'
    );
  });

  it(`should print connected apps in the plural`, () => {
    const report = mockReport({
      devServer: {
        url: 'http://127.0.0.1:8081',
        running: true,
        appsConnected: 0,
        appsListed: 0,
        appsStale: 0,
        source: 'default',
        ready: true,
        projectRootMatched: null,
        hostType: null,
        tunnelUrl: null,
        openUrls: [],
      },
    });

    expect(line(report, 'dev server')).toContain('0 apps connected');
  });

  // Status never waits for a bundle, so an unfinished one is unknown rather than failed.
  it(`should print a bundler that is still working as unknown`, () => {
    const report = mockReport({
      devServer: {
        url: 'http://127.0.0.1:8081',
        running: true,
        appsConnected: 1,
        appsListed: 1,
        appsStale: 0,
        source: 'default',
        ready: null,
        projectRootMatched: true,
        hostType: null,
        tunnelUrl: null,
        openUrls: [],
      },
    });

    expect(line(report, 'dev server')).toContain('bundler still working');
    expect(line(report, 'dev server')).not.toContain('bundler not ready');
  });

  it(`should name a dev server that serves another project`, () => {
    const report = mockReport({
      devServer: {
        url: 'http://127.0.0.1:8081',
        running: true,
        appsConnected: 1,
        appsListed: 1,
        appsStale: 0,
        source: 'scan',
        ready: true,
        projectRootMatched: false,
        hostType: null,
        tunnelUrl: null,
        openUrls: [],
      },
    });

    expect(line(report, 'dev server')).toContain('serves another project');
    expect(line(report, 'dev server')).toContain('via scan');
  });

  it(`should print a dev server that is not running with the url it probed`, () => {
    const report = mockReport({
      devServer: {
        url: 'http://127.0.0.1:8081',
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
      },
    });

    expect(line(report, 'dev server')).toContain('not running');
    expect(line(report, 'dev server')).toContain('http://127.0.0.1:8081');
  });

  it(`should print the linked skill count of the selected agents`, () => {
    expect(line(mockReport(), 'skills')).toBe('skills      claude-code · 3/3 linked');
  });

  it(`should print an out-of-sync skill count as it is`, () => {
    const report = mockReport({ skills: { agentIds: ['claude-code'], discovered: 3, linked: 1 } });

    expect(line(report, 'skills')).toContain('1/3 linked');
  });

  it(`should print that no agent is selected`, () => {
    const report = mockReport({ skills: { agentIds: null, discovered: 2, linked: 0 } });

    expect(line(report, 'skills')).toContain('no agent selected');
    expect(line(report, 'skills')).toContain('2 skills discovered');
  });

  it(`should print that the project ships no skills`, () => {
    const report = mockReport({ skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 } });

    expect(line(report, 'skills')).toContain('no skills discovered');
  });

  it(`should print the next action as the rule and the first step`, () => {
    expect(line(mockReport(), 'next')).toBe(
      'next        npx @expo/agent-cli dev → expo-go: expo start --go'
    );
  });

  // The dev-server line three rows above said the server is up; a `next` that says to start one
  // makes the reader pick which of the two rows to believe.
  it(`should print the reason instead of a plan when a dev server changed the answer`, () => {
    const report = mockReport({
      next: {
        command: 'npx @expo/agent-cli smoke',
        rule: 'expo-go',
        target: 'expo-go',
        steps: [],
        why: 'a dev server is already running, so wait for its bundle',
        buildLocation: null,
      },
    });

    const rendered = line(report, 'next');
    expect(rendered).toContain('npx @expo/agent-cli smoke');
    expect(rendered).toContain('a dev server is already running');
    expect(rendered).not.toContain('expo start --go');
  });

  it(`should count the steps that follow the first one`, () => {
    const report = mockReport({
      next: {
        command: 'npx @expo/agent-cli dev',
        rule: 'dev-client-stale',
        target: 'dev-client',
        why: null,
        buildLocation: null,
        steps: [
          {
            id: 'prebuild',
            argv: ['expo', 'prebuild', '--platform', 'ios'],
            reason: 'Generates the ios native project.',
            timeClass: 'a-minute',
            runsOn: 'local',
          },
          {
            id: 'run',
            argv: ['expo', 'run:ios'],
            reason: 'Builds the ios app.',
            timeClass: 'many-minutes',
            runsOn: 'local',
          },
        ],
      },
    });

    expect(line(report, 'next')).toContain('dev-client-stale: expo prebuild --platform ios');
    expect(line(report, 'next')).toContain('+1 more step');
  });

  it(`should note the section that could not be read and keep the others`, () => {
    const report = mockReport({
      skills: null,
      errors: { skills: 'autolinking is not installed' },
    });

    expect(line(report, 'skills')).toContain('unavailable');
    expect(line(report, 'skills')).toContain('autolinking is not installed');
    // A broken section never hides the rest of the report.
    expect(line(report, 'project')).toContain('my-app');
  });

  it(`should note a missing section even without an error message`, () => {
    const report = mockReport({ devServer: null });

    expect(line(report, 'dev server')).toContain('unavailable');
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Status
  describe('the skills line', () => {
    it(`is left out when there is no agent and no skill to report`, () => {
      const value = mockReport({ skills: { agentIds: null, discovered: 0, linked: 0 } });

      expect(report(value)).not.toContain('skills');
      // The lines that are facts about the project stay — one per section, and one more for the
      // second platform of the freshness block.
      expect(report(value).split('\n')).toHaveLength(8);
    });

    it(`stays for an agent that was selected, however few skills there are`, () => {
      const value = mockReport({ skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 } });

      expect(line(value, 'skills')).toContain('no skills discovered');
    });

    it(`stays for a project that ships skills, with no agent selected`, () => {
      const value = mockReport({ skills: { agentIds: null, discovered: 2, linked: 0 } });

      expect(line(value, 'skills')).toContain('2 skills discovered');
    });

    // A section that could not be read has a reason worth printing either way.
    it(`stays when the section could not be read`, () => {
      const value = mockReport({
        skills: null,
        errors: { skills: 'autolinking is not installed' },
      });

      expect(line(value, 'skills')).toContain('unavailable');
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
  describe('the device line', () => {
    it(`names the simulator that is booted`, () => {
      expect(line(mockReport(), 'device')).toContain('iPhone 17 (SIM-1)');
    });

    // F106 — the line named the first device and nothing else, so an Android emulator beside a
    // booted simulator was invisible in the one section whose whole subject is what this machine has.
    it(`names every device, not only the first (F106)`, () => {
      const value = mockReport({
        device: {
          state: 'present',
          platform: 'ios',
          deviceId: 'SIM-1',
          name: 'iPhone 17',
          devices: [
            { platform: 'ios', deviceId: 'SIM-1', name: 'iPhone 17' },
            { platform: 'android', deviceId: 'emulator-5554', name: 'sdk_gphone64_arm64' },
          ],
          reason: null,
        },
      });

      expect(line(value, 'device')).toContain('iPhone 17 (SIM-1)');
      expect(line(value, 'device')).toContain('android');
      expect(line(value, 'device')).toContain('emulator-5554');
    });

    it(`says none, and why, for a machine with no device`, () => {
      const value = mockReport({
        device: {
          state: 'absent',
          platform: null,
          deviceId: null,
          name: null,
          devices: [],
          reason: 'no booted iOS simulator was found',
        },
      });

      expect(line(value, 'device')).toContain('none');
      expect(line(value, 'device')).toContain('no booted iOS simulator was found');
    });

    // Never rounded down to "none": a probe that could not run has shown nothing.
    it(`says unknown when no platform tool could answer`, () => {
      const value = mockReport({
        device: {
          state: 'unknown',
          platform: null,
          deviceId: null,
          name: null,
          devices: [],
          reason: 'could not run "adb"',
        },
      });

      expect(line(value, 'device')).toContain('unknown');
      expect(line(value, 'device')).not.toContain('none');
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
  describe('the dev server line, tunnelled', () => {
    it(`names the tunnel, which the listen address does not contain`, () => {
      const value = mockReport({
        devServer: {
          url: 'http://127.0.0.1:8081',
          running: true,
          appsConnected: 0,
          source: 'lock',
          ready: true,
          projectRootMatched: true,
          hostType: 'tunnel',
          tunnelUrl: 'http://abc.boltexpo.dev',
          openUrls: [],
          appsListed: 0,
          appsStale: 0,
        },
      });

      expect(line(value, 'dev server')).toContain('tunnel http://abc.boltexpo.dev');
    });

    // @ref llp/0021-honest-reports.rfc.md §The rules
    // K7(c) and K8: the line a tunnelled `expo start` prints for itself is
    // `exp+app://<tunnel host>`, which opens the launcher rather than the app and which no HTTP
    // client can use. This is the string that works, under the address it was built from.
    it(`prints the encoded URL that opens the app, under the tunnel`, () => {
      const value = mockReport({
        devServer: {
          url: 'http://127.0.0.1:8081',
          running: true,
          appsConnected: 0,
          source: 'lock',
          ready: true,
          projectRootMatched: true,
          hostType: 'tunnel',
          tunnelUrl: 'https://x8fj2.on.staging.expo.app',
          openUrls: [
            {
              target: 'dev-build',
              label: 'development build',
              url: 'exp+sampleapp://expo-development-client/?url=https%3A%2F%2Fx8fj2.on.staging.expo.app',
            },
          ],
          appsListed: 0,
          appsStale: 0,
        },
      });

      const rendered = report(value);
      expect(rendered).toContain('open in development build:');
      expect(rendered).toContain(
        'exp+sampleapp://expo-development-client/?url=https%3A%2F%2Fx8fj2.on.staging.expo.app'
      );
    });

    // A local run's own `url` is the whole answer, and a second copy of it would be noise.
    it(`prints no open URL for a run a device off this machine cannot reach`, () => {
      expect(report(mockReport())).not.toContain('open in');
    });

    it(`says nothing extra for a plain local run`, () => {
      expect(line(mockReport(), 'dev server')).toBe(
        'dev server  running on http://127.0.0.1:8081 · via lock · bundler ready · 1 app connected'
      );
    });
  });
});

// @ref llp/0015-backend-selection-and-config.rfc.md §What `status` reports
// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
describe('the impact line', () => {
  function withImpact(
    ios: Partial<FreshnessImpact> | null,
    android: Partial<FreshnessImpact> | null = null
  ): StatusReport {
    const impact = (overrides: Partial<FreshnessImpact> | null): FreshnessImpact | null =>
      overrides && {
        class: 'needs-native-build',
        fingerprintChanged: true,
        reason: 'the autolinked native modules changed (node_modules/react-native-mmkv)',
        changedCount: 1,
        changedSources: null,
        ...overrides,
      };
    return mockReport({
      freshness: {
        comparison: {
          kind: 'last-build' as const,
          label: 'last build recorded by @expo/agent-cli',
          buildId: null,
          platform: null,
        },
        changedFiles: null,
        hashSource: COMPUTED_FINGERPRINT,
        hash: 'abcdef0123456789',
        ota: null,
        platforms: [
          {
            platform: 'ios',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'stale',
            detail: 'no recorded build',
            recordedHash: null,
            impact: impact(ios),
          },
          {
            platform: 'android',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'stale',
            detail: 'no recorded build',
            recordedHash: null,
            impact: impact(android),
          },
        ],
      },
    });
  }

  it(`names the class and the one sentence that says what carried it`, () => {
    const rendered = line(withImpact({}), 'impact');

    expect(rendered).toContain('ios: needs-native-build');
    expect(rendered).toContain('the autolinked native modules changed');
  });

  // The probe fingerprints both platforms together, so the two normally agree, and printing the
  // identical sentence twice would be the report padding itself.
  it(`prints one entry for two platforms that agree`, () => {
    const rendered = line(withImpact({}, {}), 'impact');

    expect(rendered).toContain('ios, android: needs-native-build');
    expect(
      report(withImpact({}, {}))
        .split('\n')
        .filter((text) => text.startsWith('impact')).length
    ).toBe(1);
  });

  it(`prints one entry per platform when they disagree`, () => {
    const rendered = report(
      withImpact({}, { class: 'js-only', reason: 'the native fingerprint is unchanged' })
    )
      .split('\n')
      .filter((text) => text.startsWith('impact'));

    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toContain('ios: needs-native-build');
    expect(rendered[1]).toContain('android: js-only');
  });

  // Nothing was established, and the freshness line above has already said why.
  it(`is left out entirely when nothing could be classified`, () => {
    const rendered = report(
      withImpact({ class: null, reason: 'no build is recorded for ios' }, null)
    );

    expect(rendered).not.toContain('impact');
  });

  it(`is left out for a project with no freshness section at all`, () => {
    expect(report(mockReport({ freshness: null }))).not.toContain('impact');
  });
});

// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// `--explain` is recognised by its *data* — a per-source list that is present, an OTA verdict that
// was resolved — so the text and `--json` can never disagree about what the caller asked for.
describe('the --explain detail', () => {
  function withSources(count: number): StatusReport {
    return mockReport({
      freshness: {
        comparison: {
          kind: 'last-build' as const,
          label: 'last build recorded by @expo/agent-cli',
          buildId: null,
          platform: null,
        },
        changedFiles: null,
        hashSource: COMPUTED_FINGERPRINT,
        hash: 'abcdef0123456789',
        ota: null,
        platforms: [
          {
            platform: 'ios',
            backend: 'local' as const,
            buildId: null,
            buildProfile: null,
            state: 'stale',
            detail: 'no recorded build',
            recordedHash: null,
            impact: {
              class: 'needs-native-build',
              fingerprintChanged: true,
              reason: 'the autolinked native modules changed',
              changedCount: count,
              changedSources: Array.from({ length: count }, (_, index) => ({
                op: 'added' as const,
                type: 'dir',
                path: `node_modules/module-${index}`,
                reasons: ['rncoreAutolinkingIos'],
                kind: 'native-module' as const,
                class: 'needs-native-build' as const,
              })),
            },
          },
        ],
      },
    });
  }

  it(`lists the sources that moved, with what each one is`, () => {
    const rendered = report(withSources(2));

    expect(rendered).toContain('ios changed');
    expect(rendered).toContain('added   node_modules/module-0 [native-module]');
    expect(rendered).toContain('node_modules/module-1');
  });

  it(`stops listing after a readable number and says where the rest are`, () => {
    const rendered = report(withSources(12));

    expect(rendered).toContain('node_modules/module-7');
    expect(rendered).not.toContain('node_modules/module-8');
    expect(rendered).toContain('… and 4 more, in --json');
  });

  it(`prints nothing extra on a default run, where the list is null`, () => {
    const rendered = report(mockReport());

    expect(rendered).not.toContain('changed');
    expect(rendered).not.toContain('ota');
  });

  it.each([
    [true, 'safe to publish'],
    [false, 'not safe to publish'],
    [null, 'unknown'],
  ])(`prints the ota verdict for safe: %s`, (safe, expected) => {
    const rendered = report(
      mockReport({
        freshness: {
          comparison: {
            kind: 'last-build' as const,
            label: 'last build recorded by @expo/agent-cli',
            buildId: null,
            platform: null,
          },
          changedFiles: null,
          hashSource: COMPUTED_FINGERPRINT,
          hash: 'abcdef0123456789',
          platforms: [],
          ota: {
            safe: safe as boolean | null,
            runtimeVersion: { policy: 'appVersion', literal: null, source: 'app.json' },
            why: 'The runtimeVersion policy is "appVersion".',
          },
        },
      })
    );

    expect(rendered).toContain(expected);
    expect(rendered).toContain('policy appVersion');
    expect(rendered).toContain('(app.json)');
    expect(rendered).toContain('The runtimeVersion policy is "appVersion".');
  });

  it(`says the runtimeVersion is unresolved rather than naming a policy it does not have`, () => {
    const rendered = report(
      mockReport({
        freshness: {
          comparison: {
            kind: 'last-build' as const,
            label: 'last build recorded by @expo/agent-cli',
            buildId: null,
            platform: null,
          },
          changedFiles: null,
          hashSource: COMPUTED_FINGERPRINT,
          hash: 'abcdef0123456789',
          platforms: [],
          ota: {
            safe: null,
            runtimeVersion: { policy: null, literal: null, source: null },
            why: 'Nothing could resolve the runtimeVersion.',
          },
        },
      })
    );

    expect(rendered).toContain('runtimeVersion unresolved');
  });
});

// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
describe('the eas build line', () => {
  const foundIos = {
    platform: 'ios' as const,
    state: 'found' as const,
    fingerprintHash: '8ce1acfbc22138726c1525aeb99d577a812de3cf',
    buildId: '21d7d434-6495-4e74-b8c7-68ecd0dff489',
    createdAt: '2026-08-19T17:37:12.674Z',
    buildProfile: 'simulator',
    buildUrl: 'https://expo.dev/artifacts/eas/abc.tar.gz',
    source: 'cache' as const,
    reason: null,
  };
  const notAskedAndroid = {
    platform: 'android' as const,
    state: 'unknown' as const,
    fingerprintHash: null,
    buildId: null,
    createdAt: null,
    buildProfile: null,
    buildUrl: null,
    source: null,
    reason: 'EAS was not asked — pass --explain',
  };

  it(`is left out entirely on a default run with nothing cached`, () => {
    const rendered = report(
      mockReport({ builds: { askedEas: false, platforms: [notAskedAndroid] } })
    );

    expect(rendered).not.toContain('eas build');
  });

  it(`names the build and the command that installs it when one was found`, () => {
    const rendered = line(
      mockReport({ builds: { askedEas: false, platforms: [foundIos, notAskedAndroid] } }),
      'eas build'
    );

    expect(rendered).toContain('ios: finished build');
    expect(rendered).toContain('simulator');
    expect(rendered).toContain(
      'npx eas build:download --build-id 21d7d434-6495-4e74-b8c7-68ecd0dff489'
    );
  });

  it(`prints the answer a caller asked for outright, even when it is none`, () => {
    const rendered = line(
      mockReport({
        builds: {
          askedEas: true,
          platforms: [{ ...notAskedAndroid, platform: 'ios', state: 'none', reason: null }],
        },
      }),
      'eas build'
    );

    expect(rendered).toContain('ios: none');
  });

  it(`prints the reason of an unknown, and never rounds it down to none`, () => {
    const rendered = line(
      mockReport({
        builds: {
          askedEas: true,
          platforms: [
            { ...notAskedAndroid, platform: 'ios', reason: 'EAS project not configured.' },
          ],
        },
      }),
      'eas build'
    );

    expect(rendered).toContain('ios: unknown');
    expect(rendered).toContain('EAS project not configured.');
  });

  // @ref llp/0021-honest-reports.rfc.md §The rules — live
  // staging, S9. The clipped end of this sentence is the clause that says what to do.
  it(`prints a reason too long for the line under it, rather than clipping it`, () => {
    const reason =
      'the eas at /Users/somebody/.tuft-bin/eas exited 101 and printed nothing an eas run would print, so it may not be the real CLI — check that file';

    const rendered = report(
      mockReport({
        builds: {
          askedEas: true,
          platforms: [{ ...notAskedAndroid, platform: 'ios', reason }],
        },
      })
    );

    expect(rendered).toContain(reason);
    expect(rendered).not.toContain('…');
  });

  it(`prints the section note when the section could not be read at all`, () => {
    const rendered = line(
      mockReport({ builds: null, errors: { builds: 'the record is unreadable' } }),
      'eas build'
    );

    expect(rendered).toContain('unavailable: the record is unreadable');
  });
});

// @ref llp/0021-honest-reports.rfc.md §The rules — friction
// run 7's F66. `status --explain --build abc123` printed an ordinary report and exit 0, with the id
// nowhere on it, while the JSON carried the whole reason the comparison never happened.
describe('a section that printed a line and still failed', () => {
  const failure = [
    'Could not compare against EAS build abc123.',
    'Why: "eas fingerprint:compare --build-id abc123" exited with 1.',
    'How: check the id with "npx eas build:list --limit 5 --json --non-interactive".',
  ].join('\n');

  it(`prints the failure, in full, in the text report`, () => {
    const rendered = report(mockReport({ errors: { freshness: failure } }));

    // Every line of it: the actionable half of one of these sentences is usually the last one, and
    // clipping it to a line width is what left the text report with the useless half (S9).
    for (const line of failure.split('\n')) {
      expect(rendered).toContain(line);
    }
  });

  it(`says nothing extra when no section failed`, () => {
    expect(report(mockReport())).not.toContain('note');
  });
});

describe('the build line', () => {
  /** A build location, as the resolved plan attaches one to `next`. */
  function buildLocation(overrides: Partial<PlanBuildLocation> = {}): PlanBuildLocation {
    return {
      runsOn: 'local',
      platform: 'ios',
      requirement: 'Xcode on this machine',
      status: null,
      detail: null,
      caveats: [],
      alternativeCommand: 'npx eas build --platform ios --profile development',
      selection: {
        runsOn: 'local',
        source: 'default',
        because: 'this machine has Xcode — Xcode 16.2 at /Applications/Xcode.app.',
        why: 'Building on this machine: this machine has Xcode — Xcode 16.2 at /Applications/Xcode.app.',
        doomed: false,
      },
      ...overrides,
    };
  }

  it(`is left out entirely when the next plan builds nothing`, () => {
    expect(report(mockReport())).not.toContain('build ');
  });

  it(`names the place and the cause of a local build`, () => {
    const rendered = line(
      mockReport({ next: { ...mockReport().next!, buildLocation: buildLocation() } }),
      'build'
    );

    expect(rendered).toContain('local');
    expect(rendered).toContain('this machine has Xcode');
    // The place is already the column, so the sentence must not say it a second time.
    expect(rendered).not.toContain('Building on this machine');
  });

  it(`names the place and the cause of a cloud build`, () => {
    const location = buildLocation({
      runsOn: 'eas',
      requirement: 'an Expo account',
      selection: {
        runsOn: 'eas',
        source: 'host',
        because: 'this host runs linux and a ios build needs Xcode, which does not exist for it.',
        why: 'Building in the cloud on EAS: this host runs linux and a ios build needs Xcode, which does not exist for it.',
        doomed: false,
      },
    });
    const rendered = line(
      mockReport({ next: { ...mockReport().next!, buildLocation: location } }),
      'build'
    );

    expect(rendered).toContain('eas');
    expect(rendered).toContain('this host runs linux');
  });

  it(`still says where the build runs when nothing chose it`, () => {
    const rendered = line(
      mockReport({
        next: { ...mockReport().next!, buildLocation: buildLocation({ selection: null }) },
      }),
      'build'
    );

    expect(rendered).toContain('local');
    expect(rendered).toContain('needs Xcode on this machine');
  });

  it(`is printed beside a next action that a running dev server changed`, () => {
    const rendered = report(
      mockReport({
        next: {
          command: 'npx @expo/agent-cli smoke',
          rule: 'dev-client-stale',
          target: 'dev-client',
          steps: [],
          why: 'a dev server is already running, so wait for its bundle',
          buildLocation: buildLocation({ runsOn: 'eas' }),
        },
      })
    );

    // The project still needs a cloud build; a healthy dev server does not change that.
    expect(rendered).toContain('eas');
  });
});
