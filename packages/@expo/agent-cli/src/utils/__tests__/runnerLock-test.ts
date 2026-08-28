import path from 'path';

import {
  acquireRunnerLockAsync,
  resetRunnerLocks,
  runnerSpawnKey,
  withRunnerLockAsync,
} from '../runnerLock';

afterEach(() => {
  resetRunnerLocks();
});

describe(runnerSpawnKey, () => {
  it('keys an npx spawn on the package spec, past the runner flags', () => {
    expect(runnerSpawnKey('npx', ['--yes', 'eas-cli@latest', 'build:list', '--json'])).toBe(
      'npx:eas-cli@latest'
    );
  });

  it('keys a bunx spawn found at an absolute path on the same spec', () => {
    // The path is what gets spawned and says nothing about which scratch directory is shared: bun
    // keys that on the spec, so two spellings of one runner must not be two locks.
    expect(runnerSpawnKey('/opt/homebrew/bin/bunx', ['eas-cli@latest', 'whoami'])).toBe(
      'bunx:eas-cli@latest'
    );
  });

  it('recognises the Windows spelling of both runners', () => {
    expect(runnerSpawnKey('npx.cmd', ['--yes', 'eas-cli', 'build:view'])).toBe('npx:eas-cli');
    expect(runnerSpawnKey(`C:${path.sep}bun${path.sep}bunx.exe`, ['create-expo@latest'])).toBe(
      'bunx:create-expo@latest'
    );
  });

  it('gives two different package specs two different keys', () => {
    // Two specs are two scratch directories, so serializing them would cost time and buy nothing.
    expect(runnerSpawnKey('npx', ['--yes', 'eas-cli@latest', 'whoami'])).not.toBe(
      runnerSpawnKey('npx', ['--yes', 'create-expo@latest'])
    );
  });

  it('has no key for a command that is not a package runner', () => {
    expect(runnerSpawnKey('git', ['rev-parse', 'HEAD'])).toBeNull();
    expect(runnerSpawnKey('xcrun', ['simctl', 'list'])).toBeNull();
    expect(runnerSpawnKey('/usr/local/bin/eas', ['build:list'])).toBeNull();
  });

  it('falls back to the runner alone when nothing in the argv is a package spec', () => {
    // Conservative on purpose: a spelling this function cannot read serializes more than it has to,
    // which costs a moment. Reading it wrong would cost the race back.
    expect(runnerSpawnKey('npx', ['--yes'])).toBe('npx:*');
    expect(runnerSpawnKey('npx', [])).toBe('npx:*');
  });
});

describe(acquireRunnerLockAsync, () => {
  /** Record the order two bodies actually ran in, so overlap is visible rather than inferred. */
  function tracker() {
    const events: string[] = [];
    return {
      events,
      async body(name: string, holdMs: number): Promise<void> {
        events.push(`${name}:start`);
        await new Promise((resolve) => setTimeout(resolve, holdMs));
        events.push(`${name}:end`);
      },
    };
  }

  it('never lets two holders of one key overlap', async () => {
    const { events, body } = tracker();

    await Promise.all([
      withRunnerLockAsync('npx:eas-cli@latest', () => body('first', 30)),
      withRunnerLockAsync('npx:eas-cli@latest', () => body('second', 5)),
    ]);

    // The whole finding: started milliseconds apart, the two spawns shared one scratch directory.
    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
  });

  it('lets two different keys overlap', async () => {
    const { events, body } = tracker();

    await Promise.all([
      withRunnerLockAsync('npx:eas-cli@latest', () => body('eas', 30)),
      withRunnerLockAsync('npx:create-expo@latest', () => body('create', 5)),
    ]);

    expect(events).toEqual(['eas:start', 'create:start', 'create:end', 'eas:end']);
  });

  it('hands the lock on when the holder throws', async () => {
    const { events, body } = tracker();

    const failing = withRunnerLockAsync('npx:eas-cli@latest', async () => {
      events.push('failing:start');
      throw new Error('the runner exploded');
    });
    const waiting = withRunnerLockAsync('npx:eas-cli@latest', () => body('waiting', 1));

    await expect(failing).rejects.toThrow('the runner exploded');
    await waiting;
    expect(events).toEqual(['failing:start', 'waiting:start', 'waiting:end']);
  });

  it('reports how long a spawn waited, so the queue is not free', async () => {
    const held = await acquireRunnerLockAsync('npx:eas-cli@latest');
    expect(held!.queuedMs).toBe(0);

    const queued = acquireRunnerLockAsync('npx:eas-cli@latest');
    await new Promise((resolve) => setTimeout(resolve, 25));
    held!.release();

    const lock = await queued;
    expect(lock).not.toBeNull();
    expect(lock!.queuedMs).toBeGreaterThanOrEqual(20);
    lock!.release();
  });

  it('gives up the wait rather than hanging a command that named a deadline', async () => {
    const held = await acquireRunnerLockAsync('npx:eas-cli@latest');

    const expired = await acquireRunnerLockAsync('npx:eas-cli@latest', { timeoutMs: 20 });

    expect(expired).toBeNull();
    // And the queue is intact: the waiter that gave up did not take the baton with it.
    held!.release();
    const next = await acquireRunnerLockAsync('npx:eas-cli@latest', { timeoutMs: 1000 });
    expect(next).not.toBeNull();
    next!.release();
  });
});
