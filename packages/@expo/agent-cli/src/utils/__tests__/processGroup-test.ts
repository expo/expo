// @ref src/utils/processGroup.ts
// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
//
// The bug this pins, end to end, is in `e2e/__tests__/deploy-test.ts` — the prompt-guard test sat
// for its whole 45 s timeout instead of about one second [observed — 2026-08-27]. What made it hang
// is here: `child.kill()` signals the process this CLI spawned, which since wave 18 is a package
// runner, and the CLI doing the work is *its* child. It survived, kept the inherited pipes open, and
// `'close'` never fired.

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { killProcessTree, USE_PROCESS_GROUP } from '../processGroup';
import { spawnSubprocessAsync } from '../subprocess';

const childProcess = require('child_process') as { spawnSync?: jest.Mock };

function fakeChild({ pid }: { pid?: number } = {}) {
  return Object.assign(new EventEmitter(), {
    pid,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: jest.fn(),
  });
}

const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

/** Jest's automock of `child_process` does not always include `spawnSync`. */
function mockSpawnSync(status: number | null): jest.Mock {
  const fn = jest.fn().mockReturnValue({ status });
  childProcess.spawnSync = fn;
  return fn;
}

afterEach(() => {
  jest.restoreAllMocks();
  delete childProcess.spawnSync;
  mockPlatform(realPlatform);
});

describe(killProcessTree, () => {
  it(`signals the whole group, so the runner's child dies with it`, () => {
    const kill = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const child = fakeChild({ pid: 4321 });
    const taskkill = mockSpawnSync(0);

    killProcessTree(child as any, 'SIGKILL');

    if (USE_PROCESS_GROUP) {
      // The negative pid is the group. Signalling the pid alone is what left a grandchild running.
      expect(kill).toHaveBeenCalledWith(-4321, 'SIGKILL');
      expect(child.kill).not.toHaveBeenCalled();
    } else {
      expect(taskkill).toHaveBeenCalledWith(
        'taskkill',
        ['/PID', '4321', '/T', '/F'],
        expect.objectContaining({ stdio: 'ignore', windowsHide: true })
      );
      expect(child.kill).not.toHaveBeenCalled();
    }
  });

  it(`defaults to SIGTERM, which is what a deadline and the prompt guard send`, () => {
    const kill = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const child = fakeChild({ pid: 77 });
    const taskkill = mockSpawnSync(0);

    killProcessTree(child as any);

    if (USE_PROCESS_GROUP) {
      expect(kill).toHaveBeenCalledWith(-77, 'SIGTERM');
    } else {
      expect(taskkill).toHaveBeenCalledWith(
        'taskkill',
        ['/PID', '77', '/T', '/F'],
        expect.objectContaining({ stdio: 'ignore', windowsHide: true })
      );
      expect(child.kill).not.toHaveBeenCalled();
    }
  });

  it(`falls back to the direct kill when there is no group to signal`, () => {
    // Two ways to get here: a child that never started (no pid), and a group that is already gone.
    const child = fakeChild();
    killProcessTree(child as any);
    expect(child.kill).toHaveBeenCalled();

    if (USE_PROCESS_GROUP) {
      jest.spyOn(process, 'kill').mockImplementation(() => {
        throw Object.assign(new Error('no such process'), { code: 'ESRCH' });
      });
    } else {
      mockSpawnSync(1);
    }
    const gone = fakeChild({ pid: 999 });
    killProcessTree(gone as any);
    expect(gone.kill).toHaveBeenCalled();
  });

  it(`uses taskkill /T so a Windows shell's grandchild dies with it`, () => {
    // Force the Windows branch on any host: a group signal that fails, then taskkill.
    jest.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('no group'), { code: 'ESRCH' });
    });
    mockPlatform('win32');
    const taskkill = mockSpawnSync(0);
    const child = fakeChild({ pid: 4321 });

    killProcessTree(child as any, 'SIGKILL');

    expect(taskkill).toHaveBeenCalledWith(
      'taskkill',
      ['/PID', '4321', '/T', '/F'],
      expect.objectContaining({ stdio: 'ignore', windowsHide: true })
    );
    expect(child.kill).not.toHaveBeenCalled();
  });

  it(`falls back to the direct kill when taskkill cannot run`, () => {
    jest.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('no group'), { code: 'ESRCH' });
    });
    mockPlatform('win32');
    const child = fakeChild({ pid: 4321 });
    childProcess.spawnSync = undefined;

    expect(() => killProcessTree(child as any, 'SIGKILL')).not.toThrow();
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it(`never throws for a child that cannot be signalled at all`, () => {
    const child = fakeChild();
    child.kill.mockImplementation(() => {
      throw new Error('already reaped');
    });

    expect(() => killProcessTree(child as any)).not.toThrow();
  });
});

describe('the spawn that makes a group possible', () => {
  it(`puts every subprocess in a process group of its own`, async () => {
    const child = fakeChild({ pid: 1234 });
    jest.mocked(spawn).mockReturnValue(child as any);

    const promise = spawnSubprocessAsync('npx', ['--yes', 'eas-cli@latest', 'whoami']);
    child.emit('close', 0, null);
    await promise;

    // `detached` is what creates the group. Without it the negative pid above signals this
    // process's own group, which would take `@expo/agent-cli` down with the tool.
    expect((jest.mocked(spawn).mock.calls[0]![2] as any).detached).toBe(USE_PROCESS_GROUP);
  });
});
