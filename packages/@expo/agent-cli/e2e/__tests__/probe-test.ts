/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md
//
// The project-state probe, exercised through the CLI it is published as. Every assertion here is
// a claim about the `ProjectState` contract in `src/project/types.ts`, checked against the fixture
// matrix described in `e2e/fixtures/README.md`.
//
// The probe used to be its own command, `@expo/agent-cli context`. It is now the `probe` key of
// `@expo/agent-cli status --json`, which is where these tests read it from — the fixture matrix is what
// this file is for, and the rest of the status report is covered in `status-test.ts`.
import { executeAgentCliAsync, installStubFingerprintAsync, setupFixtureAsync } from '../utils';

/** The hash the stub `@expo/fingerprint` bin of `dev-client-fresh-app` prints. */
const FIXTURE_FINGERPRINT_HASH = '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';

/** The shape of the `probe` key, per `src/project/types.ts`. */
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
};

/** Read the probe out of `status --json` in a fixture. */
async function probeAsync(
  fixtureName: string,
  env?: Record<string, string>
): Promise<ProjectState> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  const result = await executeAgentCliAsync(projectRoot, ['status', '--json'], { env });

  expect(result.exitCode).toBe(0);
  const probe = JSON.parse(result.stdout).probe;
  // A probe that could not be read is reported as null with a note in `errors`, and every
  // assertion below is about a probe that was read.
  expect(probe).not.toBeNull();
  return probe;
}

describe('the project probe of `@expo/agent-cli status --json`', () => {
  describe('go-app — an Expo Go compatible CNG project', () => {
    it('reports the project as Expo Go compatible', async () => {
      const state = await probeAsync('go-app');

      expect(state.projectRoot).toContain('go-app');
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

      // This fixture ships no `fingerprint` bin. A missing tool is reported, never thrown.
      expect(state.fingerprint.hash).toBeNull();
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
      // A failing tool is a probe result, not a command failure: `probeAsync` asserts the exit
      // code is still 0.
      const state = await probeAsync('dev-client-fresh-app', { STUB_FINGERPRINT_EXIT_CODE: '1' });

      expect(state.fingerprint.hash).toBeNull();
      expect(state.fingerprint.error).toBeTruthy();
    });
  });

  describe('broken-app — a dependency missing from node_modules', () => {
    it('still reports a state instead of failing', async () => {
      // The probe only observes; an unresolvable dependency is data, not an error. Whether the
      // missing package also shows up as an Expo Go reason is left to the probe.
      const state = await probeAsync('broken-app');

      expect(state.projectRoot).toContain('broken-app');
      expect(state.sdkVersion).toBe('54.0.0');
      expect(state.nativeDirs).toEqual({ ios: false, android: false });
    });
  });
});
