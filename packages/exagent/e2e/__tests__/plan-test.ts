/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md
//
// `exagent start --plan` emits the plan the decision table produced and exits without executing
// it, so a driving agent can present it for approval (llp/0008-guardrails). These tests check the
// plan against the fixture matrix in `e2e/fixtures/README.md`, and check that nothing ran.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubFingerprintAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
} from '../utils';

/** The shape `start --plan --json` prints, per `src/project/types.ts`. */
type StartPlan = {
  target: 'expo-go' | 'dev-client' | 'bare' | 'web';
  steps: {
    id: string;
    argv: string[];
    reason: string;
    timeClass: 'seconds' | 'a-minute' | 'minutes' | 'many-minutes';
  }[];
  rule: string;
  reasons: string[];
};

const TIME_CLASSES = ['seconds', 'a-minute', 'minutes', 'many-minutes'];

/** Copy a fixture and install both stub bins the plan engine may reach for. */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  return projectRoot;
}

/** Ask for the plan of a prepared project as text, and assert that asking executed nothing. */
async function planTextInAsync(
  projectRoot: string,
  args: string[] = [],
  env?: Record<string, string>
): Promise<string> {
  const result = await executeExagentAsync(projectRoot, ['start', '--plan', ...args], { env });

  expect(result.exitCode).toBe(0);
  // `--plan` stops after emitting the plan, so the stub `expo` bin records no invocation.
  expect(readStubExpoInvocations(projectRoot)).toEqual([]);

  return result.stdout;
}

/** Ask for the plan of a fixture as text, and assert that asking executed nothing. */
async function planTextAsync(
  fixtureName: string,
  args: string[] = [],
  env?: Record<string, string>
): Promise<string> {
  return planTextInAsync(await setupAsync(fixtureName), args, env);
}

describe('exagent start --plan', () => {
  it('documents the flag in `start --help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['start', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--plan');
  });

  describe('go-app — an Expo Go compatible CNG project', () => {
    it('plans to start the dev server for Expo Go', async () => {
      const output = await planTextAsync('go-app', ['--ios']);

      expect(output).toContain('expo-go');
      expect(output).toContain('target: expo-go');
      expect(output).toContain('expo start --go');
    });

    it('plans the same way without an explicit platform', async () => {
      const output = await planTextAsync('go-app');

      expect(output).toContain('expo start --go');
    });
  });

  describe('dev-client-app — a dev client project without a recorded build', () => {
    it('plans a prebuild and a native build for iOS', async () => {
      const output = await planTextAsync('dev-client-app', ['--ios']);

      expect(output).toContain('dev-client-stale');
      expect(output).toContain('target: dev-client');
      expect(output).toContain('expo prebuild --platform ios');
      expect(output).toContain('expo run:ios');
      // The unbundled module is why Expo Go is out, and the plan says so.
      expect(output).toContain('fake-native-module');
    });

    it('plans for Android when Android is requested', async () => {
      const output = await planTextAsync('dev-client-app', ['--android']);

      expect(output).toContain('expo prebuild --platform android');
      expect(output).toContain('expo run:android');
    });
  });

  describe('bare-app — committed native directories', () => {
    it('plans a native build without a prebuild', async () => {
      const output = await planTextAsync('bare-app', ['--ios']);

      expect(output).toContain('bare-stale');
      expect(output).toContain('target: bare');
      expect(output).toContain('expo run:ios');
      // Prebuild would overwrite the checked-in ios/ and android/ directories.
      expect(output).not.toContain('prebuild');
    });
  });

  describe('dev-client-fresh-app — a recorded build matching the fingerprint', () => {
    it('plans only the dev server, because the recorded build still matches', async () => {
      const output = await planTextAsync('dev-client-fresh-app', ['--ios']);

      expect(output).toContain('dev-client-fresh');
      expect(output).toContain('target: dev-client');
      expect(output).toContain('expo start --dev-client');
      // Nothing native has to rerun, so neither of the expensive steps is planned. The reasons
      // mention prebuild for any CNG project, so the check is on the commands, not the word.
      expect(output).not.toContain('expo prebuild');
      expect(output).not.toContain('expo run:ios');
    });

    it('plans a rebuild once the fingerprint no longer matches', async () => {
      // The stub fingerprint CLI prints whatever hash it is told to, which is how a changed
      // native surface is simulated without changing any real input.
      const output = await planTextAsync('dev-client-fresh-app', ['--ios'], {
        STUB_FINGERPRINT_HASH: 'a-hash-that-no-build-was-made-from',
      });

      expect(output).toContain('dev-client-stale');
      expect(output).toContain('expo prebuild --platform ios');
      expect(output).toContain('expo run:ios');
    });

    it('plans only the dev server for a bare project with a matching build', async () => {
      // `bare-fresh` needs a recorded build AND checked-in native directories. Rather than commit
      // a sixth near-identical fixture, the native directories are added to this copy.
      const projectRoot = await setupAsync('dev-client-fresh-app');
      await fs.promises.mkdir(path.join(projectRoot, 'ios'), { recursive: true });
      await fs.promises.mkdir(path.join(projectRoot, 'android'), { recursive: true });
      await fs.promises.writeFile(
        path.join(projectRoot, 'ios', 'Podfile'),
        "platform :ios, '15.1'\n"
      );
      await fs.promises.writeFile(path.join(projectRoot, 'android', 'build.gradle'), '// marker\n');

      const output = await planTextInAsync(projectRoot, ['--ios']);

      expect(output).toContain('bare-fresh');
      expect(output).toContain('target: bare');
      expect(output).toContain('expo start --dev-client');
      expect(output).not.toContain('expo prebuild');
    });
  });

  describe('go-app — the web platform', () => {
    it('plans the dev server for web when web is requested', async () => {
      const output = await planTextAsync('go-app', ['--web']);

      expect(output).toContain('rule: web');
      expect(output).toContain('target: web');
      expect(output).toContain('expo start --web');
      // The fixture depends on `react-native-web`, so the plan has no missing-dependency warning.
      expect(output).not.toContain('react-native-web is not a dependency');
    });
  });

  describe('the machine readable plan', () => {
    it('prints the StartPlan as JSON with `--plan --json`', async () => {
      const projectRoot = await setupFixtureAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['start', '--plan', '--json', '--ios']);

      expect(result.exitCode).toBe(0);

      // The plan is what a driving agent presents for approval, so it must parse as one object.
      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.rule).toBe('dev-client-stale');
      expect(plan.target).toBe('dev-client');
      expect(plan.steps.map((step) => step.argv)).toEqual([
        ['expo', 'prebuild', '--platform', 'ios'],
        ['expo', 'run:ios'],
      ]);
      expect(plan.reasons.length).toBeGreaterThan(0);

      // Step ids are unique, and every step names an Expo-family CLI (llp/0001 constraint 5).
      const ids = plan.steps.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of plan.steps) {
        expect(step.argv[0]).toBe('expo');
        expect(step.reason).toBeTruthy();
        expect(TIME_CLASSES).toContain(step.timeClass);
      }

      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });
});
