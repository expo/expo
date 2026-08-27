import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { event } from '../../events';
import {
  AdbProcessWaitError,
  runAdbDeviceMutationAsync,
  runAdbDeviceQueryAsync,
  runAdbHostQueryAsync,
  runBoundedAdbHostQueryAsync,
} from '../adbProcess';

jest.mock('../../events', () => ({ event: jest.fn() }));
jest.unmock('child_process');
jest.unmock('fs');
jest.unmock('node:fs');
jest.unmock('os');
jest.unmock('node:os');

describe(runAdbDeviceQueryAsync, () => {
  function createPendingSpawn({ ignoreTerm = false, ignoreKill = false } = {}) {
    let reject!: (error: unknown) => void;
    const promise = new Promise((_, rejectPromise) => {
      reject = rejectPromise;
    }) as any;
    promise.child = {
      kill: jest.fn((signal) => {
        if ((signal === 'SIGKILL' && !ignoreKill) || (signal !== 'SIGKILL' && !ignoreTerm)) {
          reject(
            Object.assign(new Error(`killed with ${signal}`), {
              signal,
              status: null,
            })
          );
        }
        return true;
      }),
    };
    return promise;
  }

  it('returns separate process output and exit data', async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: 'stdout',
      stderr: 'stderr',
      status: 0,
      signal: null,
    } as any);

    await expect(runAdbDeviceQueryAsync('adb', ['devices'], 'test command')).resolves.toMatchObject(
      {
        stdout: 'stdout',
        stderr: 'stderr',
      }
    );
    expect(event).toHaveBeenCalledWith('adb_operation_start', {
      operation: 'test command',
      phase: 'device-service',
      waitLimitMs: undefined,
    });
  });

  it('does not spawn a command when the caller signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('already cancelled');
    controller.abort(reason);

    await expect(
      runAdbDeviceMutationAsync('adb', ['install'], 'app install', controller.signal)
    ).rejects.toBe(reason);
    expect(spawnAsync).not.toHaveBeenCalled();
    expect(event).not.toHaveBeenCalled();
  });

  it('maps wait-policy expiry after observing graceful cleanup', async () => {
    const pending = createPendingSpawn();
    jest.mocked(spawnAsync).mockReturnValueOnce(pending);

    const result = runBoundedAdbHostQueryAsync('adb', ['devices'], 'device discovery', 1);
    await expect(result).rejects.toBeInstanceOf(AdbProcessWaitError);
    expect(event).toHaveBeenCalledWith('adb_operation_cleanup', {
      operation: 'device discovery',
      phase: 'host-request',
      reason: 'wait-limit',
      status: 'terminated',
    });
  });

  it('preserves a caller timeout when a longer wait policy is configured', async () => {
    const pending = createPendingSpawn();
    jest.mocked(spawnAsync).mockReturnValueOnce(pending);
    const controller = new AbortController();
    const reason = new DOMException('caller timed out', 'TimeoutError');

    const result = runBoundedAdbHostQueryAsync(
      'adb',
      ['devices'],
      'device discovery',
      10_000,
      controller.signal
    );
    controller.abort(reason);

    await expect(result).rejects.toBe(reason);
    expect(event).toHaveBeenCalledWith('adb_operation_cleanup', {
      operation: 'device discovery',
      phase: 'host-request',
      reason: 'cancelled',
      status: 'terminated',
    });
  });

  it('reports when cleanup cannot observe child exit', async () => {
    const pending = createPendingSpawn({ ignoreTerm: true, ignoreKill: true });
    jest.mocked(spawnAsync).mockReturnValueOnce(pending);
    const controller = new AbortController();
    const result = runAdbHostQueryAsync('adb', ['devices'], 'device discovery', controller.signal);

    const reason = new Error('stop discovery');
    controller.abort(reason);
    await expect(result).rejects.toBe(reason);
  });

  it('marks cancelled side-effecting operations as having unknown remote completion', async () => {
    const pending = createPendingSpawn();
    jest.mocked(spawnAsync).mockReturnValueOnce(pending);
    const controller = new AbortController();
    const result = runAdbDeviceMutationAsync('adb', ['install'], 'app install', controller.signal);

    const reason = new Error('stop install');
    controller.abort(reason);
    await expect(result).rejects.toBe(reason);
    expect(reason).toMatchObject({ remoteCompletionUnknown: true });
  });

  it('distinguishes spawn and nonzero-exit failures', async () => {
    jest.mocked(spawnAsync).mockRejectedValueOnce(
      Object.assign(new Error('ENOENT'), {
        status: null,
        signal: null,
      })
    );
    await expect(runAdbDeviceQueryAsync('adb', [], 'test command')).rejects.toMatchObject({
      spawnFailed: true,
    });

    jest.mocked(spawnAsync).mockRejectedValueOnce(
      Object.assign(new Error('exit 1'), {
        stdout: '',
        stderr: 'failed',
        status: 1,
        signal: null,
      })
    );
    await expect(runAdbDeviceQueryAsync('adb', [], 'test command')).rejects.toMatchObject({
      spawnFailed: undefined,
    });
  });
});

describe('subprocess cleanup integration', () => {
  jest.setTimeout(10_000);

  it('drains both pipes, escalates where supported, and reaps after cancellation', async () => {
    const signal = AbortSignal.timeout(300);
    const error = await runFixture(signal);

    expect(error).toBe(signal.reason);
  });
});

async function runFixture(signal: AbortSignal): Promise<unknown> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-adb-process-'));
  const pidFile = path.join(directory, 'pid');
  const fixture = path.join(__dirname, 'fixtures', 'adb-process-child.js');
  try {
    jest.mocked(spawnAsync).mockImplementationOnce(jest.requireActual('@expo/spawn-async'));
    let error: unknown;
    try {
      await runAdbHostQueryAsync(process.execPath, [fixture, pidFile], 'fixture child', signal);
    } catch (caught) {
      error = caught;
    }

    const pid = Number(fs.readFileSync(pidFile, 'utf8'));
    expect(Number.isInteger(pid)).toBe(true);
    expect(() => process.kill(pid, 0)).toThrow();
    return error;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
