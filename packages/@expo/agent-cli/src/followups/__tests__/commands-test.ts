// Builders of the remaining commands: the ones whose input is one already-gathered report.

import type { FingerprintHashSource, StatusReport } from '../../status/types';
import { buildNavigateFollowUps } from '../navigate';
import { buildRuntimeErrorsFollowUps } from '../runtime';
import { buildSkillsSyncFollowUps } from '../skills';
import { buildStatusFollowUps } from '../status';
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

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
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
    skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 },
    auth: { loggedIn: true, user: 'alice', source: 'eas whoami' },
    next: {
      command: '@expo/agent-cli dev',
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
          openUrls: [],
        },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli runtime:errors');
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
          openUrls: [],
        },
      })
    );

    expect(ids(followups)).toEqual([]);
  });

  // @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
  // The rung that removes a fifteen-minute step, so it leads whatever else the report found.
  describe('the cached EAS build', () => {
    const BUILD_ID = '21d7d434-6495-4e74-b8c7-68ecd0dff489';

    function withBuild(freshness: 'fresh' | 'stale' | 'unknown'): StatusReport {
      return mockReport({
        freshness: {
          hash: 'project-hash',
          platforms: [
            {
              platform: 'ios',
              backend: 'local' as const,
              state: freshness,
              detail: '',
              recordedHash: null,
              buildId: null,
              buildProfile: null,
              impact: null,
            },
            {
              platform: 'android',
              backend: 'local' as const,
              state: 'unknown',
              detail: '',
              recordedHash: null,
              buildId: null,
              buildProfile: null,
              impact: null,
            },
          ],
          ota: null,
          comparison: {
            kind: 'last-build',
            label: 'last build recorded by @expo/agent-cli',
            buildId: null,
            platform: null,
          },
          changedFiles: null,
          hashSource: COMPUTED_FINGERPRINT,
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
    expect(followups[0]!.command).toBe('npx @expo/agent-cli skills:sync');
    expect(followups[0]!.why).toContain('1 of 3');
  });

  it(`should not offer a sync when every discovered skill is linked`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ skills: { agentIds: ['claude-code'], discovered: 2, linked: 2 } })
    );

    expect(ids(followups)).toEqual([]);
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
  // The same rung, aimed at a directory that is not this CLI's subject, is the trap spelled as a
  // follow-up: `npx @expo/agent-cli install expo-dev-client` would have written into whatever repository
  // the caller happened to be standing in.
  it(`should offer nothing but a way out when the directory is not an Expo app`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        expoGo: { compatible: false, reasonCount: 2 },
        project: {
          root: '/project',
          name: 'plain',
          isExpoApp: false,
          sdkVersion: null,
          native: 'cng',
          nativeDirs: { ios: false, android: false },
          usesDevClient: false,
          hasWeb: false,
        },
      })
    );

    expect(ids(followups)).toEqual(['not-expo-app']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli new my-app');
  });

  // The reasons themselves are in `status --json` now, so the follow-up is the action they imply
  // rather than a second command that would only reprint them.
  it(`should offer the dev client install when Expo Go is out and none is installed`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ expoGo: { compatible: false, reasonCount: 2 } })
    );

    expect(ids(followups)).toEqual(['install-dev-client']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli install expo-dev-client');
  });

  it(`should not offer a dev client the project already depends on`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        expoGo: { compatible: false, reasonCount: 2 },
        project: {
          root: '/project',
          name: 'my-app',
          isExpoApp: true,
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
          openUrls: [],
        },
        skills: { agentIds: ['claude-code'], discovered: 3, linked: 0 },
        expoGo: { compatible: false, reasonCount: 1 },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors', 'skills-sync', 'install-dev-client']);
    expect(followups.map((followup) => followup.command)).not.toContain('@expo/agent-cli dev');
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
  // session is not a simulator on this machine (llp/0005 §Cloud simulator).
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
      'npx @expo/agent-cli runtime:errors --android'
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

  // @ref llp/0009-smart-followups.rfc.md §The follow-up block — friction run 7, F79. `navigate` returns when the
  // app has *attached*, which is not when it has rendered: run immediately, the screenshot caught
  // the Expo Go splash and "Loading project…", and the screen was ready about twelve seconds later.
  it(`says the app may still be loading when the screenshot is taken`, () => {
    const screenshot = buildNavigateFollowUps({ platform: 'ios', deviceId: 'IOS-1' })[0]!;

    expect(screenshot.why).toMatch(/still be loading|not finished loading/i);
    // And what to wait for, which is a command rather than a number of seconds.
    expect(screenshot.why).toContain('npx @expo/agent-cli runtime:tree');
  });

  // F104 — found live on 2026-08-27. The line above is good advice on iOS and impossible advice on
  // Android: `runtime:tree` needs `Runtime.evaluate`, and Expo Go for Android has no CDP debugger at
  // all (llp/0005 §Android), so following it is exit 1 every time. What can
  // wait there is `smoke`, whose screenshot phase waits on the honest neighbouring fact — two reads
  // of the target list naming the same ids — and then captures the screen itself.
  it(`does not send an Android caller to a command that cannot answer there (F104)`, () => {
    const screenshot = buildNavigateFollowUps({
      platform: 'android',
      deviceId: 'emulator-5554',
    })[0]!;

    expect(screenshot.why).toMatch(/still be loading|not finished loading/i);
    // The command is still *named*, as the thing that cannot answer — what must be gone is the
    // instruction to run it.
    expect(screenshot.why).not.toContain('run "npx @expo/agent-cli runtime:tree" first');
    expect(screenshot.why).toContain('npx @expo/agent-cli smoke --android');
  });

  it(`says it for a cloud session too, where the load is slower rather than faster`, () => {
    const screenshot = buildNavigateFollowUps({
      backend: 'cloud',
      platform: 'ios',
      deviceId: 'sess-1',
    })[0]!;

    expect(screenshot.why).toMatch(/still be loading|not finished loading/i);
  });
});

describe(buildRuntimeErrorsFollowUps, () => {
  it(`should ask for a rerun after the reported errors are fixed`, () => {
    const followups = buildRuntimeErrorsFollowUps({ count: 2, durationMs: 2000 });

    // The reload leads: an app whose render threw keeps running the code from before the fix, so
    // re-running this command first would read the old run and report the bug as unfixed.
    expect(ids(followups)).toEqual(['reload-app', 'runtime-errors-rerun']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli runtime:reload');
    expect(followups[1]!.command).toBe('npx @expo/agent-cli runtime:errors --duration 2000');
    expect(followups[1]!.why).toContain('empty');
  });

  it(`should explain that an empty window may have missed the failure`, () => {
    const followups = buildRuntimeErrorsFollowUps({ count: 0, durationMs: 2000 });

    expect(ids(followups)).toEqual(['runtime-errors-reproduce', 'runtime-errors-typecheck']);
    // A longer window, because the failure was not reproduced inside the last one.
    expect(followups[0]!.command).toBe('npx @expo/agent-cli runtime:errors --duration 4000');
    expect(followups[0]!.why).toContain('reproduce');
    // And the rung that contradicts the reading an empty window invites: the bug this command
    // cannot see does not throw at all (F34).
    expect(followups[1]!.command).toBe('npx @expo/agent-cli typecheck');
  });

  // F103 — found live on 2026-08-27. llp/0005 §Testing records F54/F58 as "every command a
  // follow-up names now carries the flag the run had", and this one never did: `runtime:errors
  // --android` suggested `npx @expo/agent-cli runtime:reload` and `npx @expo/agent-cli runtime:errors --duration
  // 6000`, both of which read whichever app the dev server lists first. On a machine with a
  // simulator and an emulator on one dev server the flagless rerun is a different question from the
  // one that was just asked — and after F100 it is a *readable* different question, which is worse:
  // the rerun answers, in iOS, and looks like a confirmation.
  it(`carries the platform of the run into every command it names (F103)`, () => {
    expect(
      buildRuntimeErrorsFollowUps({ count: 2, durationMs: 2000, platform: 'android' }).map(
        (followup) => followup.command
      )
    ).toEqual([
      'npx @expo/agent-cli runtime:reload --android',
      'npx @expo/agent-cli runtime:errors --android --duration 2000',
    ]);

    expect(
      buildRuntimeErrorsFollowUps({ count: 0, durationMs: 2000, platform: 'android' }).map(
        (followup) => followup.command
      )
    ).toEqual([
      'npx @expo/agent-cli runtime:errors --android --duration 4000',
      // `typecheck` reads the code on disk, which no platform flag changes.
      'npx @expo/agent-cli typecheck',
    ]);
  });
});

describe(buildSkillsSyncFollowUps, () => {
  it(`should offer the skill list`, () => {
    const followups = buildSkillsSyncFollowUps({ skillPackages: [], agentId: null });

    expect(ids(followups)).toEqual(['skills-list']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli skills:list');
  });

  it(`should note that a detected agent loads the linked skills by itself`, () => {
    const followups = buildSkillsSyncFollowUps({
      skillPackages: ['@expo/ui'],
      agentId: 'claude-code',
    });

    expect(ids(followups)).toEqual(['skills-list', 'skills-show']);
    expect(followups[1]!.command).toBe('npx @expo/agent-cli skills:show @expo/ui');
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
