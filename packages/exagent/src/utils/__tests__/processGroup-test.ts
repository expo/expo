// @ref src/utils/processGroup.ts
// @ref llp/0015-backend-selection-and-config.rfc.md §Killing a runner kills the CLI it started
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

function fakeChild({ pid }: { pid?: number } = {}) {
  return Object.assign(new EventEmitter(), {
    pid,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: jest.fn(),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe(killProcessTree, () => {
  it(`signals the whole group, so the runner's child dies with it`, () => {
    const kill = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const child = fakeChild({ pid: 4321 });

    killProcessTree(child as any, 'SIGKILL');

    // The negative pid is the group. Signalling the pid alone is what left a grandchild running.
    expect(kill).toHaveBeenCalledWith(-4321, 'SIGKILL');
    expect(child.kill).not.toHaveBeenCalled();
  });

  it(`defaults to SIGTERM, which is what a deadline and the prompt guard send`, () => {
    const kill = jest.spyOn(process, 'kill').mockImplementation(() => true);

    killProcessTree(fakeChild({ pid: 77 }) as any);

    expect(kill).toHaveBeenCalledWith(-77, 'SIGTERM');
  });

  it(`falls back to the direct kill when there is no group to signal`, () => {
    // Two ways to get here: a child that never started (no pid), and a group that is already gone.
    const child = fakeChild();
    killProcessTree(child as any);
    expect(child.kill).toHaveBeenCalled();

    jest.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('no such process'), { code: 'ESRCH' });
    });
    const gone = fakeChild({ pid: 999 });
    killProcessTree(gone as any);
    expect(gone.kill).toHaveBeenCalled();
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
    // process's own group, which would take `exagent` down with the tool.
    expect((jest.mocked(spawn).mock.calls[0]![2] as any).detached).toBe(USE_PROCESS_GROUP);
  });
});
