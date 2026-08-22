// Builders of the remaining commands: the ones whose input is one already-gathered report.

import type { ProjectState } from '../../project/types';
import type { StatusReport } from '../../status/types';
import { buildContextFollowUps } from '../context';
import { buildNavigateFollowUps } from '../navigate';
import { buildRuntimeErrorsFollowUps, buildRuntimeNetworkFollowUps } from '../runtime';
import { buildSkillsSyncFollowUps } from '../skills';
import { buildStatusFollowUps } from '../status';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot: '/project',
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123' },
    ...overrides,
  };
}

function mockReport(overrides: Partial<StatusReport> = {}): StatusReport {
  return {
    project: null,
    expoGo: { compatible: true, reasonCount: 0 },
    freshness: null,
    devServer: { url: 'http://127.0.0.1:8081', running: false, appsConnected: 0 },
    skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 },
    next: { command: 'exagent dev', rule: 'expo-go', target: 'expo-go', steps: [] },
    errors: {},
    ...overrides,
  };
}

describe(buildContextFollowUps, () => {
  it(`should point at status and the start plan`, () => {
    const followups = buildContextFollowUps(mockState());

    expect(ids(followups)).toEqual(['status', 'dev-plan']);
    expect(followups[0]!.command).toBe('npx exagent status');
    expect(followups[1]!.command).toBe('npx exagent dev --plan');
  });

  it(`should offer the dev client install when Expo Go is out and none is installed`, () => {
    const followups = buildContextFollowUps(
      mockState({
        expoGo: {
          compatible: false,
          reasons: [{ kind: 'config-plugin', detail: 'the app config uses a config plugin' }],
        },
      })
    );

    expect(ids(followups)).toEqual(['install-dev-client', 'status', 'dev-plan']);
    expect(followups[0]!.command).toBe('npx exagent install expo-dev-client');
  });

  it(`should not offer a dev client the project already depends on`, () => {
    const followups = buildContextFollowUps(
      mockState({ usesDevClient: true, expoGo: { compatible: false, reasons: [] } })
    );

    expect(ids(followups)).toEqual(['status', 'dev-plan']);
  });
});

describe(buildStatusFollowUps, () => {
  it(`should offer nothing for a project with nothing to act on`, () => {
    expect(buildStatusFollowUps(mockReport())).toEqual([]);
  });

  it(`should read the runtime of an app connected to the dev server`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: { url: 'http://127.0.0.1:8081', running: true, appsConnected: 1 },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors');
  });

  it(`should not offer the runtime loop for a dev server without an app`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: { url: 'http://127.0.0.1:8081', running: true, appsConnected: 0 },
      })
    );

    expect(ids(followups)).toEqual([]);
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

  it(`should point at the Expo Go reasons`, () => {
    const followups = buildStatusFollowUps(
      mockReport({ expoGo: { compatible: false, reasonCount: 2 } })
    );

    expect(ids(followups)).toEqual(['project-context']);
    expect(followups[0]!.command).toBe('npx exagent context');
  });

  it(`should never repeat the command the next line already names`, () => {
    const followups = buildStatusFollowUps(
      mockReport({
        devServer: { url: 'http://127.0.0.1:8081', running: true, appsConnected: 1 },
        skills: { agentIds: ['claude-code'], discovered: 3, linked: 0 },
        expoGo: { compatible: false, reasonCount: 1 },
      })
    );

    expect(ids(followups)).toEqual(['runtime-errors', 'skills-sync', 'project-context']);
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

    expect(ids(followups)).toEqual(['runtime-errors-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 2000');
    expect(followups[0]!.why).toContain('empty');
  });

  it(`should explain that an empty window may have missed the failure`, () => {
    const followups = buildRuntimeErrorsFollowUps({ count: 0, durationMs: 2000 });

    expect(ids(followups)).toEqual(['runtime-errors-reproduce']);
    // A longer window, because the failure was not reproduced inside the last one.
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 4000');
    expect(followups[0]!.why).toContain('reproduce');
  });
});

describe(buildRuntimeNetworkFollowUps, () => {
  it(`should point at the error window first when a request failed`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 3,
      failedCount: 1,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-errors', 'runtime-network-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
    expect(followups[1]!.command).toBe('npx exagent runtime:network --duration 5000');
  });

  it(`should ask for a longer window when the app made no request`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 0,
      failedCount: 0,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-reproduce']);
    expect(followups[0]!.command).toBe('npx exagent runtime:network --duration 10000');
    expect(followups[0]!.why).toContain('trigger');
  });

  // A request the runtime never answered is the shape a connection error takes here: React Native
  // reports the rejection to JavaScript but sends no `loadingFailed`
  // [observed — SDK 57 / RN 0.86.2, 2026-08-22].
  it(`should explain a request the runtime never answered`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 2,
      failedCount: 0,
      pendingCount: 1,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-pending', 'runtime-network-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
    expect(followups[0]!.why).toContain('connection');
    expect(followups[1]!.command).toBe('npx exagent runtime:network --duration 10000');
  });

  // Every request answered, so a wrong screen is not a network problem: look at the app instead.
  it(`should send the caller to the app when every request answered`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 2,
      failedCount: 0,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-clean']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
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
