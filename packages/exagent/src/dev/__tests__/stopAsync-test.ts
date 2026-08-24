import { readDevServerLockAsync } from '../../devLock';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../../exitCodes';
import { findPortListenerAsync } from '../portListener';
import { devStopAsync, looksLikeDevServerProcess } from '../stopAsync';
import type { DevStopOptions } from '../resolveStopOptions';

jest.mock('../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
}));
jest.mock('../portListener', () => ({
  findPortListenerAsync: jest.fn(async () => null),
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

let originalFetch: typeof fetch | undefined;
let killed: { pid: number; signal: string }[] = [];
let killSpy: jest.SpyInstance;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  killed = [];
  killSpy = jest.spyOn(process, 'kill').mockImplementation(((pid: number, signal: string) => {
    killed.push({ pid, signal });
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
      'forced',
      'lockHeld',
      'pid',
      'port',
      'reason',
      'signal',
      'stopped',
      'url',
      'waitedMs',
    ]);
  });

  // Both have to go quiet. The lock can be released while Metro is still closing its listener, and
  // a holder that dies without releasing leaves a socket file nothing answers on.
  it(`should keep waiting while the port still answers`, async () => {
    jest.mocked(readDevServerLockAsync).mockResolvedValue(null as never);
    // The first call is the initial read, which must find a lock for the signal path.
    jest
      .mocked(readDevServerLockAsync)
      .mockResolvedValueOnce(lock() as never)
      .mockResolvedValue(null as never);
    mockPort({ answering: true });

    await expect(devStopAsync(projectRoot, options({ timeoutMs: 200 }))).resolves.toBe(
      EXIT_OUTCOME_FAILED
    );
    expect(JSON.parse(printed())).toMatchObject({ stopped: false, reason: 'still-running' });
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
