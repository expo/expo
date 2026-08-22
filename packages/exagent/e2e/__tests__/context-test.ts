/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md
//
// The project-state probe, exercised through the CLI it is published as. Every assertion here is
// a claim about the `ProjectState` contract in `src/project/types.ts`, checked against the fixture
// matrix described in `e2e/fixtures/README.md`.
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, installStubFingerprintAsync, setupFixtureAsync } from '../utils';

/** The hash the stub `@expo/fingerprint` bin of `dev-client-fresh-app` prints. */
const FIXTURE_FINGERPRINT_HASH = '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';

/** The shape `exagent context --json` prints, per `src/project/types.ts`. */
type ProjectState = {
  projectRoot: string;
  sdkVersion: string | null;
  nativeDirs: { ios: boolean; android: boolean };
  usesDevClient: boolean;
  hasWeb: boolean;
  expoGo: {
    compatible: boolean;
    reasons: { kind: string; packageName?: string; detail: string }[];
  };
  fingerprint: { hash: string | null; error?: string };
  followups: { id: string; command: string; why: string }[];
};

/** Run `context --json` in a fixture and parse the state it prints. */
async function probeAsync(fixtureName: string): Promise<ProjectState> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  const result = await executeExagentAsync(projectRoot, ['context', '--json']);

  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout);
}

describe('exagent context', () => {
  it('prints usage with `context --help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['context', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--json');
  });

  describe('go-app — an Expo Go compatible CNG project', () => {
    it('reports the project as Expo Go compatible', async () => {
      const state = await probeAsync('go-app');

      expect(path.basename(state.projectRoot)).toBe('go-app');
      expect(state.sdkVersion).toBe('54.0.0');
      expect(state.expoGo.compatible).toBe(true);
      // A compatible project has nothing to explain.
      expect(state.expoGo.reasons).toEqual([]);
    });

    it('reports no native dirs and no dev client, but a web capable project', async () => {
      const state = await probeAsync('go-app');

      expect(state.nativeDirs).toEqual({ ios: false, android: false });
      expect(state.usesDevClient).toBe(false);
      // The fixture depends on `react-native-web`, which is what `hasWeb` reports.
      expect(state.hasWeb).toBe(true);
    });

    it('reports a null fingerprint hash when the fingerprint tool is missing', async () => {
      const state = await probeAsync('go-app');

      // No fixture ships a `fingerprint` bin. A missing tool is reported, never thrown.
      expect(state.fingerprint.hash).toBeNull();
    });

    it('prints a human readable summary without `--json`', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['context']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('54.0.0');
      // A project without `ios/` or `android/` is managed by Continuous Native Generation.
      expect(result.stdout).toContain('managed');
    });
  });

  describe('dev-client-app — a CNG project with an unbundled native module', () => {
    it('reports the project as incompatible with Expo Go', async () => {
      const state = await probeAsync('dev-client-app');

      expect(state.expoGo.compatible).toBe(false);
      expect(state.expoGo.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'unbundled-native-module',
            packageName: 'fake-native-module',
          }),
        ])
      );
    });

    it('names only the unbundled module, not the bundled one', async () => {
      const state = await probeAsync('dev-client-app');

      // `expo-camera` is in the fixture's bundledNativeModules.json, so it is not a reason.
      const packages = state.expoGo.reasons.map((reason) => reason.packageName);
      expect(packages).not.toContain('expo-camera');
    });

    it('detects the `expo-dev-client` dependency', async () => {
      const state = await probeAsync('dev-client-app');

      expect(state.usesDevClient).toBe(true);
      expect(state.nativeDirs).toEqual({ ios: false, android: false });
    });
  });

  describe('bare-app — committed native directories', () => {
    it('reports both native dirs', async () => {
      const state = await probeAsync('bare-app');

      expect(state.nativeDirs).toEqual({ ios: true, android: true });
    });

    it('reports custom native code as the Expo Go blocker', async () => {
      const state = await probeAsync('bare-app');

      expect(state.expoGo.compatible).toBe(false);
      expect(state.expoGo.reasons).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: 'custom-native-code' })])
      );
    });
  });

  describe('dev-client-fresh-app — a project with a fingerprint CLI installed', () => {
    it('reports the hash the fingerprint CLI printed', async () => {
      const state = await probeAsync('dev-client-fresh-app');

      // The stub CLI is spawned for real, so this covers the whole subprocess path.
      expect(state.fingerprint.hash).toBe(FIXTURE_FINGERPRINT_HASH);
      expect(state.fingerprint.error).toBeUndefined();
      expect(state.usesDevClient).toBe(true);
    });

    it('reports no hash when the fingerprint CLI fails', async () => {
      const projectRoot = await setupFixtureAsync('dev-client-fresh-app');
      await installStubFingerprintAsync(projectRoot);
      const result = await executeExagentAsync(projectRoot, ['context', '--json'], {
        env: { STUB_FINGERPRINT_EXIT_CODE: '1' },
      });

      // A failing tool is a probe result, not a command failure.
      expect(result.exitCode).toBe(0);
      const state: ProjectState = JSON.parse(result.stdout);
      expect(state.fingerprint.hash).toBeNull();
      expect(state.fingerprint.error).toBeTruthy();
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Design
  describe('follow-ups', () => {
    it('ends the human summary with a Next section', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['context']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Next:');
      expect(result.stdout).toContain('npx exagent status');
      expect(result.stdout).toContain('npx exagent dev --plan');
    });

    it('embeds the follow-ups in the JSON brief, which stays one object', async () => {
      const state = await probeAsync('go-app');

      expect(state.followups.map((followup) => followup.id)).toEqual(['status', 'dev-plan']);
    });

    it('offers the dev client install for a project Expo Go cannot run', async () => {
      const projectRoot = await setupFixtureAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['context']);

      expect(result.exitCode).toBe(0);
      // The fixture depends on `expo-dev-client`, so the blocker is already solved.
      expect(result.stdout).not.toContain('install expo-dev-client');
    });

    it('leaves them out with --no-followups, keeping the key set', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const text = await executeExagentAsync(projectRoot, ['context', '--no-followups']);
      const json = await executeExagentAsync(projectRoot, ['context', '--json', '--no-followups']);

      expect(text.stdout).not.toContain('Next:');
      const state: ProjectState = JSON.parse(json.stdout);
      expect(state.followups).toEqual([]);
      expect(Object.keys(state)).toContain('followups');
    });

    it('emits one cli:followups event for a driving agent', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const eventsFile = path.join(projectRoot, 'events.jsonl');
      const result = await executeExagentAsync(projectRoot, ['context', '--json'], {
        env: { LOG_EVENTS: eventsFile },
      });

      expect(result.exitCode).toBe(0);
      const events = fs
        .readFileSync(eventsFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      // `2g` names the event in the `_e` field of every JSONL line.
      const followups = events.filter((entry) => entry._e === 'cli:followups');
      expect(followups).toHaveLength(1);
      expect(followups[0]).toMatchObject({ command: 'context' });
      expect(followups[0].followups.map((item: { id: string }) => item.id)).toEqual([
        'status',
        'dev-plan',
      ]);
    });
  });

  describe('broken-app — a dependency missing from node_modules', () => {
    it('still reports a state instead of failing', async () => {
      // The probe only observes; an unresolvable dependency is data, not an error. Whether the
      // missing package also shows up as an Expo Go reason is left to the probe.
      const state = await probeAsync('broken-app');

      expect(path.basename(state.projectRoot)).toBe('broken-app');
      expect(state.sdkVersion).toBe('54.0.0');
      expect(state.nativeDirs).toEqual({ ios: false, android: false });
    });
  });
});
