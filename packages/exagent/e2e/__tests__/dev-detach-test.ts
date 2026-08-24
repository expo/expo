/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0005-runtime-loop-tools.rfc.md §Reading the detached dev server's output
//
// `exagent dev --detach` through the published bin. Everything worth pinning here is what a unit
// test cannot see: the parent process **returns** while a dev server it started is still running,
// that server survives the parent's exit, its output lands in a file, and `dev:stop` takes the
// whole tree down again.
//
// The dev server is the stub `expo` bin, which holds the lock exactly as the real one does — the
// wrapper is what takes the lock, and the wrapper is real here.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  readDevLockAsync,
  setupFixtureAsync,
  stubExpoEnv,
  waitForAsync,
} from '../utils';

/** Where a detached dev server writes, per `src/dev/logFile.ts`. Spelled out, as a wire contract. */
const LOG_PATH = path.join('.expo', 'dev', 'logs', 'dev-detached.log');

/** Long enough for a test to do its work against a running dev server, short enough to end. */
const STUB_ALIVE_MS = '20000';

/** Environment for a detached run whose stub dev server stays up and publishes a port. */
function detachEnv(projectRoot: string, port: number): Record<string, string> {
  return {
    ...stubExpoEnv(projectRoot),
    STUB_EXPO_DELAY_MS: STUB_ALIVE_MS,
    STUB_EXPO_DEV_SERVER_PORT: String(port),
  };
}

/** Whether a pid is still alive, without signalling it. */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Stop whatever the test started, so a failed assertion never leaves a process behind. */
async function cleanUpAsync(projectRoot: string): Promise<void> {
  await executeExagentAsync(projectRoot, ['dev:stop', '--json'], {
    env: stubExpoEnv(projectRoot),
    reject: false,
  });
}

describe('exagent dev --detach', () => {
  // The whole finding, in one assertion: the command returns, and a dev server is running.
  it('returns while the dev server it started keeps running', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['dev', '--detach', '--yes', '--json'],
        { env: detachEnv(projectRoot, 8399) }
      );

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        url: 'http://127.0.0.1:8399',
        port: 8399,
        alreadyRunning: false,
        // `--wait-ready` was not asked for, so readiness is unknown rather than false.
        ready: null,
      });
      expect(report.pid).toBeGreaterThan(0);
      expect(report.logFile).toContain(LOG_PATH);

      // The parent has exited — this test is running — and the child has not.
      expect(isAlive(report.pid)).toBe(true);
      expect(await readDevLockAsync(projectRoot)).toMatchObject({ port: 8399, pid: report.pid });
    } finally {
      await cleanUpAsync(projectRoot);
    }
  });

  it('prints one JSON object with a stable set of keys', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['dev', '--detach', '--yes', '--json'],
        { env: detachEnv(projectRoot, 8398) }
      );

      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'alreadyRunning',
        'followups',
        'logFile',
        'pid',
        'port',
        'projectRootMatched',
        'ready',
        'url',
        'waitedMs',
      ]);
    } finally {
      await cleanUpAsync(projectRoot);
    }
  });

  // The plan's rule: one detached dev server per project. A second one could not hold the lock, so
  // nothing would be able to find it or stop it — which is worse than a second foreground one.
  it('reports the running server and starts nothing on a second --detach', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    try {
      const first = await executeExagentAsync(
        projectRoot,
        ['dev', '--detach', '--yes', '--json'],
        { env: detachEnv(projectRoot, 8397) }
      );
      const firstPid = JSON.parse(first.stdout).pid;

      const second = await executeExagentAsync(
        projectRoot,
        ['dev', '--detach', '--yes', '--json'],
        { env: detachEnv(projectRoot, 8396) }
      );

      // Idempotent: exit 0, and the report is of the server that is there.
      expect(second.exitCode).toBe(0);
      expect(JSON.parse(second.stdout)).toMatchObject({
        alreadyRunning: true,
        pid: firstPid,
        port: 8397,
      });
    } finally {
      await cleanUpAsync(projectRoot);
    }
  });

  // The counterpart of the finding: `dev:stop` has to reach a process this shell never owned.
  it('is stopped by dev:stop, which takes the whole tree with it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const started = await executeExagentAsync(
      projectRoot,
      ['dev', '--detach', '--yes', '--json'],
      { env: detachEnv(projectRoot, 8395) }
    );
    const { pid } = JSON.parse(started.stdout);

    const result = await executeExagentAsync(projectRoot, ['dev:stop', '--json'], {
      env: stubExpoEnv(projectRoot),
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      stopped: true,
      pid,
      port: 8395,
      lockHeld: true,
      signal: 'SIGTERM',
    });
    // The wrapper is gone, and so is the lock it held — the two halves of "no orphan".
    expect(await waitForAsync(() => !isAlive(pid), 5000)).toBe(true);
    expect(await readDevLockAsync(projectRoot)).toBeNull();
  });

  it('rejects --wait-ready on its own, which would wait for nothing', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev', '--wait-ready', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.message).toContain('only means something with --detach');
  });

  it('says in --help that the plain command blocks and --detach does not', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:run', '--help']);

    expect(result.all).toContain('This command blocks');
    expect(result.all).toContain('--detach');
  });
});

describe('exagent dev:logs', () => {
  it('reads what the detached dev server printed', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    try {
      await executeExagentAsync(projectRoot, ['dev', '--detach', '--yes', '--json'], {
        env: detachEnv(projectRoot, 8394),
      });
      // The stub prints its start line as soon as it runs; the file is written by the child.
      await waitForAsync(
        () => (fs.readFileSync(path.join(projectRoot, LOG_PATH), 'utf8') || '').includes('stub_expo_start'),
        5000
      );

      const result = await executeExagentAsync(projectRoot, ['dev:logs', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.logFile).toContain(LOG_PATH);
      expect(report.lines.join('\n')).toContain('stub_expo_start');
      expect(report.devServer).toMatchObject({ port: 8394 });
    } finally {
      await cleanUpAsync(projectRoot);
    }
  });

  it('fences the log as untrusted content in the human report', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    try {
      await executeExagentAsync(projectRoot, ['dev', '--detach', '--yes', '--json'], {
        env: detachEnv(projectRoot, 8393),
      });
      await waitForAsync(() => fs.existsSync(path.join(projectRoot, LOG_PATH)), 5000);

      const result = await executeExagentAsync(projectRoot, ['dev:logs'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.stdout).toContain('BEGIN UNTRUSTED APP OUTPUT');
      expect(result.stdout).toContain('END UNTRUSTED APP OUTPUT');
    } finally {
      await cleanUpAsync(projectRoot);
    }
  });

  it('caps the read at --tail lines and says how many there are', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const logPath = path.join(projectRoot, LOG_PATH);
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    await fs.promises.writeFile(
      logPath,
      Array.from({ length: 40 }, (_, index) => `line ${index + 1}`).join('\n') + '\n'
    );

    const result = await executeExagentAsync(projectRoot, ['dev:logs', '--tail', '3', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      lines: ['line 38', 'line 39', 'line 40'],
      totalLines: 40,
      truncated: true,
      // Nothing is running, so the log is what the last detached run left.
      devServer: null,
    });
  });

  it('exits 1 and says how to get one when the project has no log', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:logs', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('NO_DEV_LOG');
    expect(error.suggestedCommand).toBe('npx exagent dev --detach --wait-ready');
  });

  it('appears in the top-level help, next to the command that writes it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.all).toContain('dev:logs');
    expect(result.all).toContain('dev blocks this terminal');
  });
});
