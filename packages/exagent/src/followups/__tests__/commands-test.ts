// Builders of the remaining commands: the ones whose input is one already-gathered report.

import type { StatusReport } from '../../status/types';
import { buildNavigateFollowUps } from '../navigate';
import { buildRuntimeErrorsFollowUps } from '../runtime';
import { buildSkillsSyncFollowUps } from '../skills';
import { buildStatusFollowUps } from '../status';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function mockReport(overrides: Partial<StatusReport> = {}): StatusReport {
  return {
    project: {
      root: '/project',
      name: 'my-app',
      sdkVersion: '54.0.0',
      native: 'cng',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: true,
    },
    expoGo: { compatible: true, reasonCount: 0 },
    freshness: null,
    builds: null,
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
    },
    device: {
      state: 'present',
      platform: 'ios',
      deviceId: 'SIM-1',
      name: 'iPhone 17',
      reason: null,
    },
    skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 },
    auth: { loggedIn: true, user: 'kudo', source: 'eas whoami' },
    next: {
      command: 'exagent dev',
      rule: 'expo-go',
      target: 'expo-go',
      steps: [],
      why: null,
      buildLocation: null,
    },
    assertion: null,
    probe: null,
    errors: {},
    ...overrides,
  };
}

describe(buildStatusFollowUps, () => {
  it(`should offer nothing for a project with nothing to act on`, () => {
    expect(buildStatusFollowUps(mockReport())).toEqual([]);
  });

  it(`should read the runtime of an app connected to the dev server`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: {
          url: 'http://127.0.0.1:8081',
          running: true,
          appsConnected: 1,
          appsListed: 1,
          appsStale: 0,
          source: 'default',
          ready: true,
          projectRootMatched: true,
          hostType: null,
          tunnelUrl: null,
        },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors');
  });

  it(`should not offer the runtime loop for a dev server without an app`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: {
          url: 'http://127.0.0.1:8081',
          running: true,
          appsConnected: 0,
          appsListed: 0,
          appsStale: 0,
          source: 'default',
          ready: true,
          projectRootMatched: true,
          hostType: null,
          tunnelUrl: null,
        },
      })
    );

    expect(ids(followups)).toEqual([]);
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
  // The rung that removes a fifteen-minute step, so it leads whatever else the report found.
  describe('the cached EAS build', () => {
    const BUILD_ID = '21d7d434-6495-4e74-b8c7-68ecd0dff489';

    function withBuild(freshness: 'fresh' | 'stale' | 'unknown'): StatusReport {
      return mockReport({
        freshness: {
          hash: 'project-hash',
          platforms: [
            { platform: 'ios', state: freshness, detail: '', recordedHash: null, impact: null },
            { platform: 'android', state: 'unknown', detail: '', recordedHash: null, impact: null },
          ],
          ota: null,
          comparison: { kind: 'last-build', label: 'last build recorded by exagent', buildId: null },
          changedFiles: null,
        },
        builds: {
          askedEas: true,
          platforms: [
            {
              platform: 'ios',
              state: 'found',
              fingerprintHash: 'ios-hash',
              buildId: BUILD_ID,
              createdAt: '2026-08-19T17:37:12.674Z',
              buildProfile: 'simulator',
              buildUrl: 'https://expo.dev/artifacts/eas/abc.tar.gz',
              source: 'cache',
              reason: null,
            },
          ],
        },
      });
    }

    it(`should offer the download when this project's own build is stale`, () => {
      const followups = buildStatusFollowUps(withBuild('stale'));

      expect(ids(followups)).toEqual(['cached-build']);
      expect(followups[0]!.command).toBe(`npx eas build:download --build-id ${BUILD_ID}`);
    });

    it(`should offer nothing when the installed build already matches`, () => {
      expect(ids(buildStatusFollowUps(withBuild('fresh')))).toEqual([]);
    });

    // Nothing established which app is installed, so a download would be a guess.
    it(`should offer nothing when freshness could not be decided`, () => {
      expect(ids(buildStatusFollowUps(withBuild('unknown')))).toEqual([]);
    });
  });

  it(`should offer a sync for the skills that are discovered but not linked`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ skills: { agentIds: ['claude-code'], discovered: 3, linked: 1 } })
    );

    expect(ids(followups)).toEqual(['skills-sync']);
    expect(followups[0]!.command).toBe('npx exagent skills:sync');
    expect(followups[0]!.why).toContain('1 of 3');
  });

  it(`should not offer a sync when every discovered skill is linked`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ skills: { agentIds: ['claude-code'], discovered: 2, linked: 2 } })
    );

    expect(ids(followups)).toEqual([]);
  });

  // The reasons themselves are in `status --json` now, so the follow-up is the action they imply
  // rather than a second command that would only reprint them.
  it(`should offer the dev client install when Expo Go is out and none is installed`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ expoGo: { compatible: false, reasonCount: 2 } })
    );

    expect(ids(followups)).toEqual(['install-dev-client']);
    expect(followups[0]!.command).toBe('npx exagent install expo-dev-client');
  });

  it(`should not offer a dev client the project already depends on`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        expoGo: { compatible: false, reasonCount: 2 },
        project: {
          root: '/project',
          name: 'my-app',
          sdkVersion: '54.0.0',
          native: 'cng',
          nativeDirs: { ios: false, android: false },
          usesDevClient: true,
          hasWeb: true,
        },
      })
    );

    expect(ids(followups)).toEqual([]);
  });

  it(`should never repeat the command the next line already names`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: {
          url: 'http://127.0.0.1:8081',
          running: true,
          appsConnected: 1,
          appsListed: 1,
          appsStale: 0,
          source: 'default',
          ready: true,
          projectRootMatched: true,
          hostType: null,
          tunnelUrl: null,
        },
        skills: { agentIds: ['claude-code'], discovered: 3, linked: 0 },
        expoGo: { compatible: false, reasonCount: 1 },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors', 'skills-sync', 'install-dev-client']);
    expect(followups.map((followup) => followup.command)).not.toContain('exagent dev');
  });

  it(`should offer nothing when every section failed to be read`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        expoGo: null,
        devServer: null,
        skills: null,
        next: null,
        errors: { project: 'unreadable' },
      })
    );

    expect(followups).toEqual([]);
  });
});

describe(buildNavigateFollowUps, () => {
  // A `Try:` line has to be runnable, and `xcrun simctl io <session-id>` is not one: a cloud
  // session is not a simulator on this machine (llp/0005 §The cloud simulator backend).
  it(`names the controller's screenshot verb for a cloud session, not xcrun`, () => {
    const followups = buildNavigateFollowUps({
      backend: 'cloud',
      platform: 'ios',
      deviceId: 'sess-1',
    });
    const screenshot = followups.find((followup) => followup.id === 'screenshot');

    expect(screenshot?.command).toContain('eas simulator:exec');
    expect(screenshot?.command).toContain('screenshot screen.png');
    expect(screenshot?.command).not.toContain('xcrun');
    expect(screenshot?.command).not.toContain('sess-1');
  });

  it(`still reads this platform's errors through the dev server, cloud or not`, () => {
    const followups = buildNavigateFollowUps({
      backend: 'cloud',
      platform: 'android',
      deviceId: 'sess-1',
    });

    expect(followups.find((followup) => followup.id === 'runtime-errors')?.command).toBe(
      'npx exagent runtime:errors --android'
    );
  });

  it(`should offer the simulator screenshot and the runtime loop on iOS`, () => {
    const followups = buildNavigateFollowUps({ platform: 'ios', deviceId: 'IOS-1' });

    expect(ids(followups)).toEqual(['screenshot', 'runtime-errors']);
    expect(followups[0]!.command).toBe('xcrun simctl io IOS-1 screenshot screen.png');
  });

  it(`should offer the adb screenshot on Android`, () => {
    const followups = buildNavigateFollowUps({ platform: 'android', deviceId: 'emulator-5554' });

    expect(ids(followups)).toEqual(['screenshot', 'runtime-errors']);
    expect(followups[0]!.command).toBe('adb -s emulator-5554 exec-out screencap -p > screen.png');
  });
});

describe(buildRuntimeErrorsFollowUps, () => {
  it(`should ask for a rerun after the reported errors are fixed`, () => {
    const followups = buildRuntimeErrorsFollowUps({ count: 2, durationMs: 2000 });

    // The reload leads: an app whose render threw keeps running the code from before the fix, so
    // re-running this command first would read the old run and report the bug as unfixed.
    expect(ids(followups)).toEqual(['reload-app', 'runtime-errors-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:reload');
    expect(followups[1]!.command).toBe('npx exagent runtime:errors --duration 2000');
    expect(followups[1]!.why).toContain('empty');
  });

  it(`should explain that an empty window may have missed the failure`, () => {
    const followups = buildRuntimeErrorsFollowUps({ count: 0, durationMs: 2000 });

    expect(ids(followups)).toEqual(['runtime-errors-reproduce', 'runtime-errors-typecheck']);
    // A longer window, because the failure was not reproduced inside the last one.
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 4000');
    expect(followups[0]!.why).toContain('reproduce');
    // And the rung that contradicts the reading an empty window invites: the bug this command
    // cannot see does not throw at all (F34).
    expect(followups[1]!.command).toBe('npx exagent typecheck');
  });
});

describe(buildSkillsSyncFollowUps, () => {
  it(`should offer the skill list`, () => {
    const followups = buildSkillsSyncFollowUps({ skillPackages: [], agentId: null });

    expect(ids(followups)).toEqual(['skills-list']);
    expect(followups[0]!.command).toBe('npx exagent skills:list');
  });

  it(`should note that a detected agent loads the linked skills by itself`, () => {
    const followups = buildSkillsSyncFollowUps({
      skillPackages: ['@expo/ui'],
      agentId: 'claude-code',
    });

    expect(ids(followups)).toEqual(['skills-list', 'skills-show']);
    expect(followups[1]!.command).toBe('npx exagent skills:show @expo/ui');
    expect(followups[1]!.why).toContain('claude-code');
    expect(followups[1]!.why).toContain('automatically');
  });

  it(`should not name a skill when no agent is driving the CLI`, () => {
    const followups = buildSkillsSyncFollowUps({ skillPackages: ['@expo/ui'], agentId: null });

    expect(ids(followups)).toEqual(['skills-list']);
  });

  it(`should not name a skill when the project ships none`, () => {
    const followups = buildSkillsSyncFollowUps({ skillPackages: [], agentId: 'claude-code' });

    expect(ids(followups)).toEqual(['skills-list']);
  });
});
