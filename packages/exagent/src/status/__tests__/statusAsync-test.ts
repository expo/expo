import fs from 'fs';
import { vol } from 'memfs';

import { event } from '../../events';
import * as Log from '../../log';
import { readAuthPreflightAsync } from '../../needsHuman/preflight';
import { readLastBuildFingerprints } from '../../plan/lastBuild';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { discoverDevServerAsync } from '../../runtime/devServer';
import { waitForBundlerReadyAsync } from '../../runtime/waitReady';
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
jest.mock('../../runtime/devServer', () => ({ discoverDevServerAsync: jest.fn() }));
jest.mock('../../runtime/waitReady', () => ({ waitForBundlerReadyAsync: jest.fn() }));
// The preflight spawns `eas whoami`; these tests are about the report, not about the machine the
// suite happens to run on.
jest.mock('../../needsHuman/preflight', () => ({ readAuthPreflightAsync: jest.fn() }));
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
  jest
    .mocked(readAuthPreflightAsync)
    .mockResolvedValue({ loggedIn: true, user: 'kudo', source: 'eas whoami' });
  jest.mocked(discoverDevServerAsync).mockResolvedValue({
    reachable: true,
    targets: [{} as any],
    devServerUrl,
    source: 'default',
    discovered: false,
  });
  jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
    ready: true,
    projectRootMatched: true,
    reportedProjectRoot: projectRoot,
    timedOut: false,
    waitedMs: 1,
  });
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
    expect(report.devServer).toEqual({
      url: devServerUrl,
      running: true,
      appsConnected: 1,
      source: 'default',
      ready: true,
      projectRootMatched: true,
      hostType: null,
      tunnelUrl: null,
      tunnelExpired: null,
    });
    expect(report.skills).toEqual({ agentIds: ['claude-code'], discovered: 1, linked: 1 });
    expect(report.next?.rule).toBe('expo-go');
  });

  // The whole probe rides along, so `status --json` is the project brief the former
  // `exagent context` printed, and nothing has to run a second command for the raw facts.
  it(`should carry the raw project probe`, async () => {
    const state = mockState({
      expoGo: {
        compatible: false,
        reasons: [
          {
            kind: 'unbundled-native-module',
            packageName: 'fake-native-module',
            detail: 'is native',
          },
        ],
      },
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.probe).toEqual(state);
    // The reasons the `expoGo` section only counts are readable here.
    expect(report.probe?.expoGo.reasons).toHaveLength(1);
    expect(report.expoGo).toEqual({ compatible: false, reasonCount: 1 });
  });

  it(`should report a null probe when the project could not be read`, async () => {
    jest.mocked(probeProjectStateAsync).mockRejectedValue(new Error('project is unreadable'));

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.probe).toBeNull();
    expect(report.errors.project).toBe('project is unreadable');
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
    jest.mocked(discoverDevServerAsync).mockResolvedValue({
      reachable: false,
      targets: [],
      reason: 'fetch failed',
      devServerUrl,
      source: 'default',
      discovered: false,
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer).toEqual({
      url: devServerUrl,
      running: false,
      appsConnected: 0,
      source: 'default',
      ready: null,
      projectRootMatched: null,
      hostType: null,
      tunnelUrl: null,
      tunnelExpired: null,
      reason: 'fetch failed',
    });
    // Nothing answered, so nothing was asked about readiness either.
    expect(jest.mocked(waitForBundlerReadyAsync)).not.toHaveBeenCalled();
    // A missing dev server is information, so every other section is still reported.
    expect(report.errors).toEqual({});
    expect(report.project).not.toBeNull();
  });

  // @ref llp/0010 — `status` reports where the project is now and never waits for a bundle, so
  // "still working" is its own answer and not a claim that the bundler failed.
  it(`should report an unknown readiness when the bundler is still working`, async () => {
    jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
      ready: false,
      projectRootMatched: true,
      reportedProjectRoot: projectRoot,
      timedOut: true,
      waitedMs: 400,
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer?.ready).toBeNull();
    expect(report.devServer?.projectRootMatched).toBe(true);
  });

  it(`should report a dev server that answered /status with something else as not ready`, async () => {
    jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
      ready: false,
      projectRootMatched: null,
      reportedProjectRoot: null,
      timedOut: false,
      waitedMs: 3,
      reason: 'not an Expo dev server',
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer?.ready).toBe(false);
  });

  it(`should report the discovery step that found the dev server`, async () => {
    jest.mocked(discoverDevServerAsync).mockResolvedValue({
      reachable: true,
      targets: [],
      devServerUrl: 'http://127.0.0.1:8090',
      source: 'lock',
      discovered: true,
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer?.source).toBe('lock');
  });

  it(`should report another project's dev server as not matching`, async () => {
    jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
      ready: true,
      projectRootMatched: false,
      reportedProjectRoot: '/other-project',
      timedOut: false,
      waitedMs: 2,
    });

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.devServer?.projectRootMatched).toBe(false);
  });

  it(`should stop waiting for a dev server that never answers`, async () => {
    jest.mocked(discoverDevServerAsync).mockReturnValue(new Promise(() => {}));

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

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol — what an agent reads before it
  // starts a command that would stop on a login.
  it(`should report who the CLI family acts as`, async () => {
    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.auth).toEqual({ loggedIn: true, user: 'kudo', source: 'eas whoami' });
  });

  it(`should note an auth section it could not read, and report the rest`, async () => {
    jest.mocked(readAuthPreflightAsync).mockRejectedValue(new Error('eas is not executable'));

    const report = await collectStatusReportAsync(projectRoot, options);

    expect(report.auth).toBeNull();
    expect(report.errors.auth).toContain('eas is not executable');
    expect(report.project).not.toBeNull();
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
      'device',
      'skills',
      'auth',
      'next',
      'probe',
      'errors',
      'followups',
    ]);
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    await printStatusAsync(projectRoot, { ...options, json: true });

    expect(Object.keys(JSON.parse(output())).sort()).toEqual([
      'auth',
      'devServer',
      'device',
      'errors',
      'expoGo',
      'followups',
      'freshness',
      'next',
      'probe',
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
      'auth',
      'devServer',
      'device',
      'errors',
      'expoGo',
      'followups',
      'freshness',
      'next',
      'probe',
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
      devServerHostType: null,
      tunnelUrl: null,
      tunnelExpired: false,
      localDevice: 'unknown',
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
            command: 'npx exagent runtime:errors',
            why: expect.any(String),
          },
        ],
      });
      expect(output()).not.toContain('Suggested next:');
    });

    it(`should embed the follow-ups in the JSON report`, async () => {
      await printStatusAsync(projectRoot, { ...options, json: true });

      expect(Log.log).toHaveBeenCalledTimes(1);
      expect(JSON.parse(output()).followups).toEqual([
        { id: 'runtime-errors', command: 'npx exagent runtime:errors', why: expect.any(String) },
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
        'install-dev-client',
      ]);
      // The dev server of this fixture is running with an app attached, so `next` is the readiness
      // gate rather than `exagent dev` — and deliberately not `runtime:errors`, which the
      // `runtime-errors` follow-up above already names.
      expect(report.next.command).toBe('exagent dev:wait --require-app');
      expect(
        report.followups.map((followup: { command: string }) => followup.command)
      ).not.toContain(report.next.command);
    });

    it(`should embed an empty list with --no-followups, keeping the key set`, async () => {
      await printStatusAsync(projectRoot, { ...options, json: true, followups: false });

      expect(JSON.parse(output()).followups).toEqual([]);
      expect(event).not.toHaveBeenCalledWith('followups', expect.anything());
    });
  });
});
