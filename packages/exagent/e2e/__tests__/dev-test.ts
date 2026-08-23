/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Contract
//
// `exagent dev` emits the plan and then runs its steps as subprocesses. `plan-test.ts` covers
// which plan each fixture state produces; this file covers what actually runs: the order of the
// `expo` invocations, the stop on the first failing step, and the build record written after a
// successful native build.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubFingerprintAsync,
  killAsync,
  readDevLockAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  spawnExagent,
  waitForDevLockAsync,
} from '../utils';

/** The record `src/plan/lastBuild.ts` writes, relative to the project root. */
const LAST_BUILD_FILE = path.join('.expo', 'exagent-last-build.json');

/** The hash the stub `@expo/fingerprint` bin of `dev-client-fresh-app` prints by default. */
const RECORDED_HASH = '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';

/** A hash no build was made from, so the fixture reads as stale and gets rebuilt. */
const CHANGED_HASH = 'b1c2d3e4f5061728394a5b6c7d8e9f0011223344';

/** Copy a fixture and install both stub bins a plan may reach for. */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  return projectRoot;
}

/** The arguments of every recorded stub `expo` invocation, in the order they happened. */
function invocationArgs(projectRoot: string): string[][] {
  return readStubExpoInvocations(projectRoot).map((invocation) => invocation.args);
}

/** Read the last-build record, or null when the run wrote none. */
function readLastBuildRecord(projectRoot: string): Record<string, string> | null {
  const filePath = path.join(projectRoot, LAST_BUILD_FILE);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

describe('exagent dev', () => {
  it('documents the plan flags in `dev:run --help`', async () => {
    const projectRoot = await setupAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['dev:run', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--plan');
    expect(result.all).toContain('--yes');
    // The plain `expo start` wrapper is a command of its own now, and is named here.
    expect(result.all).toContain('npx exagent start');
  });

  // `dev` became a group so `dev:wait` could join it, and a group asked for help lists its actions
  // (llp/0010 §Registry rules). The plan engine's own options moved one hop, to `dev:run --help`.
  it('lists the actions of the group for `dev --help`', async () => {
    const projectRoot = await setupAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['dev', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('dev:run');
    expect(result.all).toContain('dev:wait');
    expect(result.all).toContain('npx exagent dev runs dev:run');
  });

  it('does not accept the flags that moved off `start`', async () => {
    // `--smart` and `--passthrough` are gone: this command is the plan engine, and `expo start`
    // rejects the flags it does not know, from the step the plan ends with.
    const projectRoot = await setupAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['dev:run', '--help']);

    expect(result.all).not.toContain('--smart');
    expect(result.all).not.toContain('--passthrough');
  });

  // @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
  it('runs a plan that builds without asking, with no TTY to ask on', async () => {
    // An agent and a CI job get the plan and its execution, never a prompt; the guardrail of
    // llp/0008 is for a person watching a terminal.
    const projectRoot = await setupAsync('dev-client-app');
    const result = await executeExagentAsync(projectRoot, ['dev', '--ios']);

    expect(result.all).not.toContain('Run this plan?');
  });

  describe('dev-client-app — a plan of two steps', () => {
    it('runs prebuild and the native build, in that order', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--ios']);

      expect(result.exitCode).toBe(0);
      expect(invocationArgs(projectRoot)).toEqual([['prebuild', '--platform', 'ios'], ['run:ios']]);
    });

    it('emits the plan before the first step runs', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--ios']);

      // The stub `expo` bin announces itself on stdout, and the plan shares that stream, so the
      // plan-first contract is observable in the output order.
      const planAt = result.stdout.indexOf('Smart start plan');
      const firstStepAt = result.stdout.indexOf('stub_expo_start');
      expect(planAt).toBeGreaterThanOrEqual(0);
      expect(firstStepAt).toBeGreaterThan(planAt);
    });

    it('stops at the first failing step and forwards its exit code', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--ios'], {
        env: { STUB_EXPO_EXIT_CODE: '3' },
        reject: false,
      });

      expect(result.exitCode).toBe(3);
      // The native build depends on the prebuild, so it never runs.
      expect(invocationArgs(projectRoot)).toEqual([['prebuild', '--platform', 'ios']]);
    });

    it('records no build when the fingerprint is unavailable', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await executeExagentAsync(projectRoot, ['dev', '--ios']);

      // This fixture ships no fingerprint CLI, so there is no hash to record the build against,
      // and an unrecorded build is planned again next time.
      expect(readLastBuildRecord(projectRoot)).toBeNull();
    });
  });

  describe('dev-client-fresh-app — a rebuild after the native surface changed', () => {
    it('records the built fingerprint, keeping the other platform', async () => {
      const projectRoot = await setupAsync('dev-client-fresh-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--ios'], {
        env: { STUB_FINGERPRINT_HASH: CHANGED_HASH },
      });

      expect(result.exitCode).toBe(0);
      expect(invocationArgs(projectRoot)).toEqual([['prebuild', '--platform', 'ios'], ['run:ios']]);
      // Only the platform that was built is updated.
      expect(readLastBuildRecord(projectRoot)).toEqual({
        ios: CHANGED_HASH,
        android: RECORDED_HASH,
      });
    });

    it('runs only the dev server when the recorded build still matches', async () => {
      const projectRoot = await setupAsync('dev-client-fresh-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--ios']);

      expect(result.exitCode).toBe(0);
      expect(invocationArgs(projectRoot)).toEqual([['start', '--dev-client', '--ios']]);
      // Nothing was built, so the record is untouched.
      expect(readLastBuildRecord(projectRoot)).toEqual({
        ios: RECORDED_HASH,
        android: RECORDED_HASH,
      });
    });
  });

  describe('go-app — a plan of one step', () => {
    it('starts the dev server for Expo Go', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['dev']);

      expect(result.exitCode).toBe(0);
      expect(invocationArgs(projectRoot)).toEqual([['start', '--go']]);
      // The dev server step runs through the same wrapper as `exagent start`, whose skill sync is
      // covered by `wrapper-test.ts`.
      expect(result.stdout).toContain('stub_expo_dev_server_ready');
    });

    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
    it('publishes the dev server it started on the project lock', async () => {
      // The dev-server step of a plan is the same wrapper `exagent start` uses, so it takes the
      // same lock — a `dev` run has to be findable exactly like a `start` run.
      const projectRoot = await setupAsync('go-app');
      const child = spawnExagent(projectRoot, ['dev'], {
        env: { STUB_EXPO_DELAY_MS: '30000', STUB_EXPO_DEV_SERVER_PORT: '8088' },
      });
      try {
        expect(await waitForDevLockAsync(projectRoot)).toMatchObject({
          url: 'http://127.0.0.1:8088',
          port: 8088,
          pid: child.pid,
        });
      } finally {
        await killAsync(child);
      }

      expect(await readDevLockAsync(projectRoot)).toBeNull();
    });
  });
});
