import { readDevServerLockAsync } from '../../devLock';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../../exitCodes';
import { findPortListenerAsync, isPortInUseAsync } from '../portListener';
import type { DevStopOptions } from '../resolveStopOptions';
import { devStopAsync, looksLikeDevServerProcess } from '../stopAsync';

jest.mock('../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
}));
jest.mock('../portListener', () => ({
  findPortListenerAsync: jest.fn(async () => null),
  isPortInUseAsync: jest.fn(async () => false),
}));

const projectRoot = '/project';

function lock(overrides: Record<string, unknown> = {}) {
  return {
    url: 'http://127.0.0.1:8081',
    port: 8081,
    pid: 4242,
    startedAt: '2026-08-23T00:00:00.000Z',
    projectRoot,
    ...overrides,
  };
}

function options(overrides: Partial<DevStopOptions> = {}): DevStopOptions {
  return {
    port: null,
    signal: 'SIGTERM',
    force: false,
    timeoutMs: 300,
    json: true,
    followups: false,
    ...overrides,
  };
}

/** Answer `/status` as an Expo dev server, or refuse the connection. */
function mockPort({ answering }: { answering: boolean }) {
  globalThis.fetch = (async () => {
    if (!answering) {
      throw new Error('connect ECONNREFUSED');
    }
    return { ok: true, text: async () => 'packager-status:running' };
  }) as unknown as typeof fetch;
}

function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

/** What reached stderr: the what / why / how of a refusal, which is where the guard is named. */
function printedErrors(): string {
  return jest.mocked(console.error).mock.calls.flat().join('\n');
}

let originalFetch: typeof fetch | undefined;
let killed: { pid: number; signal: string }[] = [];
let killSpy: jest.SpyInstance;

/**
 * Processes that exist on this fake machine.
 *
 * Empty by default, so a pid nothing added is a pid that is gone — which is the state after a
 * signal that worked, and the state the ordinary stop is asserted against. A test that needs a
 * process to survive its signal puts the pid in here and clears {@link signalKills}.
 */
let livePids = new Set<number>();

/** Whether a signal ends the process it is delivered to. */
let signalKills = true;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  killed = [];
  livePids = new Set();
  signalKills = true;
  killSpy = jest.spyOn(process, 'kill').mockImplementation(((
    pid: number,
    signal: string | number
  ) => {
    // Signal 0 is the existence check `isProcessAlive` uses, and delivers nothing.
    if (signal === 0) {
      if (!livePids.has(pid)) {
        const error: NodeJS.ErrnoException = new Error('kill ESRCH');
        error.code = 'ESRCH';
        throw error;
      }
      return true;
    }
    killed.push({ pid, signal: String(signal) });
    if (signalKills) {
      livePids.delete(pid);
    }
    return true;
  }) as never);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  killSpy.mockRestore();
});

describe(devStopAsync, () => {
  // The ordinary path. The lock names the pid, and signalling that pid is enough for the whole
  // tree because both spawn paths forward terminal signals to the `expo start` child.
  it(`should signal the pid the lock names, and report it stopped`, async () => {
    jest
      .mocked(readDevServerLockAsync)
      .mockResolvedValueOnce(lock() as never)
      .mockResolvedValue(null as never);
    mockPort({ answering: false });

    await expect(devStopAsync(projectRoot, options())).resolves.toBe(EXIT_OK);
    expect(killed).toEqual([{ pid: 4242, signal: 'SIGTERM' }]);
    expect(JSON.parse(printed())).toMatchObject({
      stopped: true,
      pid: 4242,
      port: 8081,
      url: 'http://127.0.0.1:8081',
      lockHeld: true,
      signal: 'SIGTERM',
      forced: false,
      reason: null,
      detail: null,
    });
  });

  it(`should print a stable set of top-level keys with --json`, async () => {
    jest
      .mocked(readDevServerLockAsync)
      .mockResolvedValueOnce(lock() as never)
      .mockResolvedValue(null as never);
    mockPort({ answering: false });

    await devStopAsync(projectRoot, options());

    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'detail',
      'followups',
      'forceRefusedBy',
      'forced',
      'lockHeld',
      'pid',
      'port',
      'portStillAnswering',
      'processStillRunning',
      'reason',
      'signal',
      'stopped',
      'url',
      'waitedMs',
    ]);
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §A port number is not one listener — friction run 5,
  // F48-10. The pid answers "did my signal work"; the port answers "is that number in use", and
  // only the first is what this command was asked about.
  describe('the pid is the evidence, and the port is not', () => {
    it(`should keep waiting while the process it signalled is still running`, async () => {
      jest
        .mocked(readDevServerLockAsync)
        .mockResolvedValueOnce(lock() as never)
        .mockResolvedValue(null as never);
      mockPort({ answering: true });
      livePids.add(4242);
      signalKills = false;

      await expect(devStopAsync(projectRoot, options({ timeoutMs: 200 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(JSON.parse(printed())).toMatchObject({
        stopped: false,
        reason: 'still-running',
        processStillRunning: true,
      });
      expect(printedErrors()).toContain('SIGKILL');
    });

    // The split-stack case, and every other "something else has that port number" case with it:
    // the checks here are over 127.0.0.1, so a dev server on ::1 and a stranger on 127.0.0.1 share
    // a port and neither sees the other. This used to be exit 20 about a process already gone.
    it(`should report it stopped when the process is gone and the port still answers`, async () => {
      jest
        .mocked(readDevServerLockAsync)
        .mockResolvedValueOnce(lock() as never)
        .mockResolvedValue(null as never);
      mockPort({ answering: true });

      await expect(devStopAsync(projectRoot, options({ timeoutMs: 200 }))).resolves.toBe(EXIT_OK);
      expect(JSON.parse(printed())).toMatchObject({
        stopped: true,
        processStillRunning: false,
        portStillAnswering: true,
        reason: null,
      });
    });

    it(`should say whose listener the port is not, rather than leaving the contradiction`, async () => {
      jest
        .mocked(readDevServerLockAsync)
        .mockResolvedValueOnce(lock() as never)
        .mockResolvedValue(null as never);
      mockPort({ answering: true });

      await devStopAsync(projectRoot, options({ timeoutMs: 200, json: false, followups: true }));

      expect(printed()).toContain('still answering, by something else');
      expect(printed()).toContain('::1');
      // The rung comes first, because it is what settles which listener that is.
      expect(printed()).toContain('npx exagent dev:stop --port 8081');
    });

    // The other half of "the pid is primary": the signal worked, and what did not go away is the
    // project's own lock. `--signal SIGKILL` has nothing left to signal, so it must not be offered.
    it(`should not offer SIGKILL when the pid is gone and the lock still answers`, async () => {
      jest.mocked(readDevServerLockAsync).mockResolvedValue(lock() as never);
      mockPort({ answering: false });

      await expect(devStopAsync(projectRoot, options({ timeoutMs: 200 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(JSON.parse(printed())).toMatchObject({
        stopped: false,
        reason: 'still-running',
        processStillRunning: false,
      });
      // Named to be ruled out, never offered: the recovery is the other dev server.
      expect(printedErrors()).toContain('SIGKILL has nothing left to signal');
      expect(printedErrors()).not.toContain('which the process cannot decline');
      expect(printedErrors()).toContain('npx exagent status --json');
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes. The end state the caller asked for is the
  // state it is already in, so a second `dev:stop` must not read as a failure.
  it(`should exit 0 when nothing was running`, async () => {
    jest.mocked(readDevServerLockAsync).mockResolvedValue(null as never);

    await expect(devStopAsync(projectRoot, options())).resolves.toBe(EXIT_OK);
    expect(JSON.parse(printed())).toMatchObject({
      stopped: false,
      pid: null,
      lockHeld: false,
      reason: 'not-running',
    });
    expect(killed).toEqual([]);
  });

  it(`should say to pass --port when there is no lock and no port to look at`, async () => {
    jest.mocked(readDevServerLockAsync).mockResolvedValue(null as never);

    await devStopAsync(projectRoot, options());

    expect(JSON.parse(printed()).detail).toContain('--port');
  });

  // @ref llp/0021-honest-reports.rfc.md §`--port` names the target — friction run 7,
  // F60. The one destructive verb in the surface acted on a port the caller did not name.
  describe('--port names the target, and the lock does not overrule it', () => {
    beforeEach(() => {
      jest.mocked(readDevServerLockAsync).mockResolvedValue(
        lock({ port: 8190, url: 'http://127.0.0.1:8190', pid: 4242 }) as never
      );
      livePids.add(4242);
    });

    it(`should not signal the lock's pid when --port names another port`, async () => {
      mockPort({ answering: false });
      jest.mocked(findPortListenerAsync).mockResolvedValue({ pid: 777, command: 'python3' });

      await expect(devStopAsync(projectRoot, options({ port: 8195 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );

      expect(killed).toEqual([]);
      const report = JSON.parse(printed());
      expect(report).toMatchObject({
        stopped: false,
        port: 8195,
        pid: 777,
        lockHeld: false,
        reason: 'foreign-dev-server',
      });
      // The lock is named so the caller can tell the two dev servers apart, and never acted on.
      expect(report.detail).toContain('8190');
    });

    it(`should signal the lock's pid when --port names the port the lock holds`, async () => {
      jest
        .mocked(readDevServerLockAsync)
        .mockResolvedValueOnce(lock({ port: 8190, url: 'http://127.0.0.1:8190' }) as never)
        .mockResolvedValue(null as never);
      mockPort({ answering: false });

      await expect(devStopAsync(projectRoot, options({ port: 8190 }))).resolves.toBe(EXIT_OK);

      expect(killed).toEqual([{ pid: 4242, signal: 'SIGTERM' }]);
      expect(JSON.parse(printed())).toMatchObject({
        stopped: true,
        port: 8190,
        lockHeld: true,
      });
    });
  });

  // @ref llp/0021-honest-reports.rfc.md §`--port` names the target — friction run 7,
  // F72. "Nothing is listening" is a claim, and it was made about a port something was on.
  describe('a port this machine will not name a listener for', () => {
    beforeEach(() => {
      jest.mocked(readDevServerLockAsync).mockResolvedValue(null as never);
      jest.mocked(findPortListenerAsync).mockResolvedValue(null);
      mockPort({ answering: false });
    });

    it(`should report it as a foreign listener when the port cannot be bound`, async () => {
      jest.mocked(isPortInUseAsync).mockResolvedValue(true);

      await expect(devStopAsync(projectRoot, options({ port: 8195 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );

      const report = JSON.parse(printed());
      expect(report).toMatchObject({ stopped: false, reason: 'foreign-dev-server' });
      expect(report.detail).toContain('no Expo dev server answered on port 8195');
      expect(report.detail).not.toContain('nothing is listening');
    });

    it(`should report nothing running only when the port is free`, async () => {
      jest.mocked(isPortInUseAsync).mockResolvedValue(false);

      await expect(devStopAsync(projectRoot, options({ port: 8195 }))).resolves.toBe(EXIT_OK);

      const report = JSON.parse(printed());
      expect(report).toMatchObject({ stopped: false, reason: 'not-running' });
      expect(report.detail).toContain('nothing is listening on port 8195');
    });

    it(`should name the listener's pid rather than claiming the port is quiet`, async () => {
      jest.mocked(findPortListenerAsync).mockResolvedValue({ pid: 63465, command: 'python3' });

      await expect(devStopAsync(projectRoot, options({ port: 8195 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );

      const report = JSON.parse(printed());
      expect(report.detail).toContain('pid 63465 (python3) is listening and is not one');
    });
  });

  describe('a dev server this CLI did not start', () => {
    beforeEach(() => {
      jest.mocked(readDevServerLockAsync).mockResolvedValue(null as never);
      mockPort({ answering: true });
      jest.mocked(findPortListenerAsync).mockResolvedValue({ pid: 777, command: 'node' });
    });

    // The one thing this command must not do by accident: kill a listener nobody asked about. A
    // second project's dev server on the port is the ordinary case.
    it(`should report it and leave it running`, async () => {
      await expect(devStopAsync(projectRoot, options({ port: 8081 }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(killed).toEqual([]);
      const report = JSON.parse(printed());
      expect(report).toMatchObject({
        stopped: false,
        pid: 777,
        lockHeld: false,
        reason: 'foreign-dev-server',
      });
      expect(report.detail).toContain('777');
    });

    it(`should stop it with --force, when both proofs agree`, async () => {
      let statusCalls = 0;
      globalThis.fetch = (async () => {
        // Answering while the proof is taken, gone once the signal has landed.
        if (statusCalls++ < 2) {
          return { ok: true, text: async () => 'packager-status:running' };
        }
        throw new Error('connect ECONNREFUSED');
      }) as unknown as typeof fetch;

      await expect(devStopAsync(projectRoot, options({ port: 8081, force: true }))).resolves.toBe(
        EXIT_OK
      );
      expect(killed).toEqual([{ pid: 777, signal: 'SIGTERM' }]);
      expect(JSON.parse(printed())).toMatchObject({ stopped: true, forced: true, reason: null });
    });

    // Both proofs, or nothing is killed: a `/status` answer says a dev server is there but not
    // which pid owns it, and a pid lookup can race a port closed and reopened between the reads.
    it(`should refuse --force when the process does not look like a dev server`, async () => {
      jest.mocked(findPortListenerAsync).mockResolvedValue({ pid: 777, command: 'nginx' });

      await expect(devStopAsync(projectRoot, options({ port: 8081, force: true }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(killed).toEqual([]);
    });

    it(`should refuse --force when the port does not answer as a dev server`, async () => {
      globalThis.fetch = (async () => ({
        ok: true,
        text: async () => '<!DOCTYPE html>',
      })) as unknown as typeof fetch;

      await expect(devStopAsync(projectRoot, options({ port: 8081, force: true }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(killed).toEqual([]);
    });

    it(`should refuse --force when the machine will not name the process`, async () => {
      jest.mocked(findPortListenerAsync).mockResolvedValue(null);

      await expect(devStopAsync(projectRoot, options({ port: 8081, force: true }))).resolves.toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(killed).toEqual([]);
      expect(JSON.parse(printed()).detail).toContain('would not name');
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §A port with no lock behind it — friction run 5,
    // F48-1. A refusal that answers "run it again with --force" to a caller who passed --force is
    // a next action that cannot work, and it hides the only thing worth knowing: which of the two
    // proofs did not hold.
    describe('a refused --force', () => {
      it(`should report which proof failed when the process is not a dev server's`, async () => {
        jest.mocked(findPortListenerAsync).mockResolvedValue({ pid: 777, command: 'nginx' });

        await devStopAsync(projectRoot, options({ port: 8081, force: true }));

        expect(JSON.parse(printed()).forceRefusedBy).toBe('foreign-process');
        expect(printedErrors()).toContain('nginx');
        expect(printedErrors()).not.toContain('again with --force');
      });

      it(`should report which proof failed when the port is not a dev server`, async () => {
        globalThis.fetch = (async () => ({
          ok: true,
          text: async () => '<!DOCTYPE html>',
        })) as unknown as typeof fetch;

        await devStopAsync(projectRoot, options({ port: 8081, force: true }));

        expect(JSON.parse(printed()).forceRefusedBy).toBe('not-a-dev-server');
        expect(printedErrors()).toContain('packager-status:running');
        expect(printedErrors()).not.toContain('again with --force');
      });

      it(`should report which proof failed when the machine names no process`, async () => {
        jest.mocked(findPortListenerAsync).mockResolvedValue(null);

        await devStopAsync(projectRoot, options({ port: 8081, force: true }));

        expect(JSON.parse(printed()).forceRefusedBy).toBe('unnamed-process');
        expect(printedErrors()).not.toContain('again with --force');
      });

      // Null when the flag was not passed: the field says which proof `--force` failed on, and
      // there is no such proof to report for a run that never asked for one.
      it(`should be null when --force was not passed`, async () => {
        await devStopAsync(projectRoot, options({ port: 8081 }));

        expect(JSON.parse(printed()).forceRefusedBy).toBeNull();
        expect(printedErrors()).toContain('--force');
      });
    });
  });
});

describe(looksLikeDevServerProcess, () => {
  it.each(['node', '/usr/local/bin/node', 'expo', 'metro', 'bun'])(
    `should recognize %s`,
    (command) => {
      expect(looksLikeDevServerProcess({ pid: 1, command })).toBe(true);
    }
  );

  it.each(['nginx', 'Docker', 'python3', ''])(`should not recognize %s`, (command) => {
    expect(looksLikeDevServerProcess({ pid: 1, command })).toBe(false);
  });
});
