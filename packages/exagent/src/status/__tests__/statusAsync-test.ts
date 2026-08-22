import fs from 'fs';
import { vol } from 'memfs';

import { event } from '../../events';
import * as Log from '../../log';
import { readLastBuildFingerprints } from '../../plan/lastBuild';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { probeDevServerAsync } from '../../runtime/devServer';
import { getPersistedAgentIdsAsync } from '../../skills/agents';
import { discoverSkillsAsync } from '../../skills/discovery';
import type { DiscoveredSkill } from '../../skills/types';
import { formatStatusReport } from '../format';
import { collectStatusReportAsync, printStatusAsync } from '../statusAsync';
import type { StatusReport } from '../types';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../project/probe', () => ({ probeProjectStateAsync: jest.fn() }));
jest.mock('../../plan/lastBuild', () => ({ readLastBuildFingerprints: jest.fn(() => ({})) }));
jest.mock('../../runtime/devServer', () => ({ probeDevServerAsync: jest.fn() }));
jest.mock('../../skills/discovery', () => ({ discoverSkillsAsync: jest.fn(async () => []) }));
jest.mock('../../skills/agents', () => ({
  ...jest.requireActual('../../skills/agents'),
  getPersistedAgentIdsAsync: jest.fn(async () => null),
}));

const projectRoot = '/project';
const devServerUrl = 'http://127.0.0.1:8081';
const options = { devServerUrl };

const uiSkill: DiscoveredSkill = {
  name: 'expo-ui',
  path: '/project/node_modules/@expo/ui/skills/expo-ui',
  packageName: '@expo/ui',
  linkName: 'expo-ui',
};

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  const state: ProjectState = {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abcdef0123456789' },
    ...overrides,
  };
  jest.mocked(probeProjectStateAsync).mockResolvedValue(state);
  return state;
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ '/project/package.json': JSON.stringify({ name: 'my-app' }) });
  mockState();
  jest.mocked(readLastBuildFingerprints).mockReturnValue({});
  jest.mocked(probeDevServerAsync).mockResolvedValue({ reachable: true, targets: [{} as any] });
  jest.mocked(discoverSkillsAsync).mockResolvedValue([]);
  jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(null);
});

describe(collectStatusReportAsync, () => {
  it(`should report every section of a running project`, async () => {
    jest.mocked(readLastBuildFingerprints).mockReturnValue({ ios: 'abcdef0123456789' });
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(['claude-code']);
    jest.mocked(discoverSkillsAsync).mockResolvedValue([uiSkill]);
    await fs.promises.mkdir(uiSkill.path, { recursive: true });
    await fs.promises.mkdir('/project/.claude/skills', { recursive: true });
    // An absolute target, because memfs resolves a relative one against `process.cwd()`.
    await fs.promises.symlink(uiSkill.path, '/project/.claude/skills/expo-ui');

    const report = await collectStatusReportAsync(projectRoot, { ...options, platform: 'ios' });

    expect(report.errors).toEqual({});
    expect(report.project).toEqual({
      root: projectRoot,
      name: 'my-app',
      sdkVersion: '54.0.0',
      native: 'cng',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: true,
    });
    expect(report.expoGo).toEqual({ compatible: true, reasonCount: 0 });
    expect(report.freshness?.platforms[0]).toMatchObject({ platform: 'ios', state: 'fresh' });
    expect(report.devServer).toEqual({ url: devServerUrl, running: true, appsConnected: 1 });
    expect(report.skills).toEqual({ agentIds: ['claude-code'], discovered: 1, linked: 1 });
    expect(report.next?.rule).toBe('expo-go');
  });

  it(`should report a skill that is discovered but not linked`, async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(['claude-code']);
    jest.mocked(discoverSkillsAsync).mockResolvedValue([uiSkill]);

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.skills).toEqual({ agentIds: ['claude-code'], discovered: 1, linked: 0 });
  });

  it(`should report that no agent is selected`, async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValue([uiSkill]);

    const report = await collectStatusReportAsync(projectRoot, options);

    // Without a cached selection there is nowhere to link to, so nothing counts as linked.
    expect(report.skills).toEqual({ agentIds: null, discovered: 1, linked: 0 });
  });

  it(`should report a dev server that does not answer`, async () => {
    jest
      .mocked(probeDevServerAsync)
      .mockResolvedValue({ reachable: false, targets: [], reason: 'fetch failed' });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer).toEqual({
      url: devServerUrl,
      running: false,
      appsConnected: 0,
      reason: 'fetch failed',
    });
    // A missing dev server is information, so every other section is still reported.
    expect(report.errors).toEqual({});
    expect(report.project).not.toBeNull();
  });

  it(`should stop waiting for a dev server that never answers`, async () => {
    jest.mocked(probeDevServerAsync).mockReturnValue(new Promise(() => {}));

    const report = await collectStatusReportAsync(projectRoot, {
      ...options,
      devServerTimeoutMs: 1,
    });

    expect(report.devServer?.running).toBe(false);
    expect(report.devServer?.reason).toMatch(/1ms/);
  });

  it(`should report an unknown freshness when there is no fingerprint tool`, async () => {
    mockState({ fingerprint: { hash: null, error: 'fingerprint CLI not found' } });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.freshness?.hash).toBeNull();
    expect(report.freshness?.error).toBe('fingerprint CLI not found');
    expect(report.freshness?.platforms.map((platform) => platform.state)).toEqual([
      'unknown',
      'unknown',
    ]);
  });

  it(`should report a bare project and the plan that builds it`, async () => {
    mockState({
      nativeDirs: { ios: true, android: false },
      expoGo: { compatible: false, reasons: [{ kind: 'custom-native-code', detail: 'ios/' }] },
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.project?.native).toBe('bare');
    expect(report.next?.rule).toBe('bare-stale');
  });

  it(`should report an Expo Go incompatible project without a dev client`, async () => {
    mockState({
      expoGo: {
        compatible: false,
        reasons: [
          { kind: 'unbundled-native-module', packageName: 'react-native-fancy', detail: 'native' },
        ],
      },
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.expoGo).toEqual({ compatible: false, reasonCount: 1 });
    expect(report.next?.rule).toBe('needs-dev-client');
  });

  it(`should note the sections a failed probe leaves unknown, and report the rest`, async () => {
    jest.mocked(probeProjectStateAsync).mockRejectedValue(new Error('project is unreadable'));

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.project).toBeNull();
    expect(report.expoGo).toBeNull();
    expect(report.freshness).toBeNull();
    expect(report.next).toBeNull();
    expect(report.errors.project).toContain('project is unreadable');
    // The sections that do not need the project state are still reported.
    expect(report.devServer?.running).toBe(true);
    expect(report.skills).not.toBeNull();
  });

  it(`should note a skills section it could not read`, async () => {
    jest.mocked(discoverSkillsAsync).mockRejectedValue(new Error('autolinking is not installed'));

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.skills).toBeNull();
    expect(report.errors.skills).toContain('autolinking is not installed');
    expect(report.project).not.toBeNull();
  });

  it(`should fall back to the directory name when the project has no package.json`, async () => {
    vol.reset();

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.project?.name).toBe('project');
  });
});

/** Everything the command printed, joined into one string. */
function output(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

describe(printStatusAsync, () => {
  it(`should print one JSON object with every section`, async () => {
    await printStatusAsync(projectRoot, { ...options, json: true });

    expect(Log.log).toHaveBeenCalledTimes(1);
    const report: StatusReport = JSON.parse(output());
    expect(Object.keys(report)).toEqual([
      'project',
      'expoGo',
      'freshness',
      'devServer',
      'skills',
      'next',
      'errors',
      'followups',
    ]);
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    await printStatusAsync(projectRoot, { ...options, json: true });

    expect(Object.keys(JSON.parse(output())).sort()).toEqual([
      'devServer',
      'errors',
      'expoGo',
      'followups',
      'freshness',
      'next',
      'project',
      'skills',
    ]);
  });

  it(`should print the same key set when a section could not be read`, async () => {
    jest.mocked(probeProjectStateAsync).mockRejectedValue(new Error('project is unreadable'));

    await printStatusAsync(projectRoot, { ...options, json: true });

    // A failed section is reported as null plus a note in `errors`, so the shape never changes.
    expect(Log.log).toHaveBeenCalledTimes(1);
    expect(Object.keys(JSON.parse(output())).sort()).toEqual([
      'devServer',
      'errors',
      'expoGo',
      'followups',
      'freshness',
      'next',
      'project',
      'skills',
    ]);
  });

  it(`should print the human readable report by default`, async () => {
    const report = await collectStatusReportAsync(projectRoot, options);
    jest.mocked(Log.log).mockClear();

    await printStatusAsync(projectRoot, options);

    expect(output()).toBe(formatStatusReport(report));
  });

  it(`should emit the status event for the driving agent`, async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(['claude-code']);

    await printStatusAsync(projectRoot, { ...options, platform: 'ios' });

    expect(event).toHaveBeenCalledWith('status', {
      rule: 'expo-go',
      sdkVersion: '54.0.0',
      expoGoCompatible: true,
      devServerRunning: true,
      appsConnected: 1,
      freshness: { ios: 'stale', android: 'stale' },
      skillsDiscovered: 0,
      skillsLinked: 0,
      sectionErrors: [],
    });
  });

  it(`should emit the event even when a section could not be read`, async () => {
    jest.mocked(probeProjectStateAsync).mockRejectedValue(new Error('project is unreadable'));

    await printStatusAsync(projectRoot, options);

    expect(event).toHaveBeenCalledWith(
      'status',
      expect.objectContaining({ rule: null, sectionErrors: ['project'] })
    );
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — status already carries "next",
  // so its follow-ups reach a driving agent only through the event and the JSON report.
  describe('follow-ups', () => {
    it(`should emit the follow-up event without adding a section to the text report`, async () => {
      await printStatusAsync(projectRoot, options);

      expect(event).toHaveBeenCalledWith('followups', {
        command: 'status',
        followups: [
          {
            id: 'runtime-errors',
            command: 'npx exagent runtime errors',
            why: expect.any(String),
          },
        ],
      });
      expect(output()).not.toContain('Next:');
    });

    it(`should embed the follow-ups in the JSON report`, async () => {
      await printStatusAsync(projectRoot, { ...options, json: true });

      expect(Log.log).toHaveBeenCalledTimes(1);
      expect(JSON.parse(output()).followups).toEqual([
        { id: 'runtime-errors', command: 'npx exagent runtime errors', why: expect.any(String) },
      ]);
    });

    it(`should never repeat the plan the next line already names`, async () => {
      jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(['claude-code']);
      jest.mocked(discoverSkillsAsync).mockResolvedValue([uiSkill]);
      mockState({ expoGo: { compatible: false, reasons: [] } });

      await printStatusAsync(projectRoot, { ...options, json: true });

      const report = JSON.parse(output());
      expect(report.followups.map((followup: { id: string }) => followup.id)).toEqual([
        'runtime-errors',
        'skills-sync',
        'project-context',
      ]);
      expect(report.next.command).toBe('exagent dev');
    });

    it(`should embed an empty list with --no-followups, keeping the key set`, async () => {
      await printStatusAsync(projectRoot, { ...options, json: true, followups: false });

      expect(JSON.parse(output()).followups).toEqual([]);
      expect(event).not.toHaveBeenCalledWith('followups', expect.anything());
    });
  });
});
