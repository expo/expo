import { vol } from 'memfs';
import os from 'os';

import { holdDevServerLockAsync } from '../../devLock';
import type { DevServerLockHandle } from '../../devLock';
import * as Log from '../../log';
import { autoSyncSkillsAsync } from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { resolveStartOptions } from '../resolveOptions';
import { runDevServerAsync, SKILLS_SYNC_IDLE_DELAY_MS, startAsync } from '../startAsync';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({ autoSyncSkillsAsync: jest.fn() }));
jest.mock('../../devLock', () => ({ holdDevServerLockAsync: jest.fn() }));

const projectRoot = '/project';

/** Everything the wrapper printed before handing the terminal to `expo start`. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

/** Pin this host's LAN address, so the real-device follow-up does not depend on the machine. */
function mockLanAddress(address: string) {
  jest
    .spyOn(os, 'networkInterfaces')
    .mockReturnValue({ en0: [{ address, family: 'IPv4', internal: false }] } as any);
}

/** Keep `expo start` "running" until the returned callback ends it. */
function mockLongRunningStart(): (code: number) => void {
  let end: (code: number) => void = () => {};
  jest.mocked(runExpoAsync).mockReturnValue(
    new Promise<number>((resolve) => {
      end = resolve;
    })
  );
  return (code) => end(code);
}

/** A held lock whose `release` can be asserted on. */
function mockHeldLock(): DevServerLockHandle {
  const lock: DevServerLockHandle = {
    address: '/project/.expo/exagent-dev-server.sock',
    replacedStale: false,
    release: jest.fn(),
  };
  jest.mocked(holdDevServerLockAsync).mockResolvedValue(lock);
  return lock;
}

beforeEach(() => {
  jest.useFakeTimers();
  vol.reset();
  jest.mocked(autoSyncSkillsAsync).mockResolvedValue(undefined);
  // No lock unless a test asks for one: the wrapper must work either way.
  jest.mocked(holdDevServerLockAsync).mockResolvedValue(null);
  mockLanAddress('192.168.1.5');
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe(startAsync, () => {
  it(`should run expo start with the forwarded arguments`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--web']));

    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['start', '--web']);

    end(0);
    await promise;
  });

  it(`should not sync skills before the idle delay elapses`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS - 1);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();

    end(0);
    await promise;
  });

  it(`should sync skills after the idle delay while the dev server runs`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS);
    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot, { silent: false });

    end(0);
    await promise;
  });

  it(`should not sync skills with --no-agent-skills`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--no-agent-skills']));

    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS * 2);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();

    end(0);
    await promise;
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  it(`should print the follow-ups before handing the terminal to expo start`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    // Printed synchronously, before the subprocess exists: nothing printed after Metro starts
    // streaming survives in a terminal a person or an agent reads.
    expect(printed()).toContain('Suggested next:');
    // The step nothing else does: a dev server serves a bundle and opens no app.
    expect(printed()).toContain('npx exagent navigate /');
    expect(printed()).toContain('exp://192.168.1.5:8081');
    expect(printed()).toContain('npx exagent runtime:errors');

    end(0);
    await promise;
  });

  it(`should offer a tunnel instead of an exp:// URL for a development build`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--dev-client']));

    expect(printed()).toContain('npx exagent start --tunnel');
    expect(printed()).not.toContain('exp://');

    end(0);
    await promise;
  });

  // `expo start` reads the dependency, not only the flag, so the URL shape has to as well.
  it(`should offer a tunnel for a project that depends on expo-dev-client`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        dependencies: { 'expo-dev-client': '~5.0.0' },
      }),
    });
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    expect(printed()).toContain('npx exagent start --tunnel');
    expect(printed()).not.toContain('exp://');

    end(0);
    await promise;
  });

  // On a native run the three nearer rungs crowd the EAS one out; a web run has no device steps,
  // so it is the shape that shows the rung is still built.
  it(`should offer the production build when the project has an eas.json`, async () => {
    vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--web']));

    expect(printed()).toContain('npx eas build --profile production');

    end(0);
    await promise;
  });

  it(`should leave out the device hint when only the web bundle is served`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--web']));

    expect(printed()).toContain('Suggested next:');
    expect(printed()).not.toContain('exp://');
    expect(printed()).not.toContain('--tunnel');

    end(0);
    await promise;
  });

  it(`should print nothing with --no-followups`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--no-followups']));

    expect(Log.log).not.toHaveBeenCalled();
    // The flag is exagent's own, so `expo start` never sees it.
    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['start']);

    end(0);
    await promise;
  });

  it(`should cancel the pending sync when the dev server exits early`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    end(1);
    await expect(promise).resolves.toBe(1);

    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS * 2);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();
  });
});

describe(runDevServerAsync, () => {
  it(`should run any dev server command and sync skills`, async () => {
    const end = mockLongRunningStart();
    const promise = runDevServerAsync(projectRoot, ['run:ios'], { agentSkills: true });

    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['run:ios']);
    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS);
    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot, { silent: false });

    end(0);
    await promise;
  });

  it(`should skip the sync when agent skills are off`, async () => {
    const end = mockLongRunningStart();
    const promise = runDevServerAsync(projectRoot, ['run:android'], { agentSkills: false });

    jest.advanceTimersByTime(SKILLS_SYNC_IDLE_DELAY_MS * 2);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();

    end(0);
    await promise;
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
  describe('the dev server lock', () => {
    it(`should publish the dev server alongside the subprocess`, async () => {
      const end = mockLongRunningStart();
      const promise = runDevServerAsync(projectRoot, ['start', '--port', '8082'], {
        agentSkills: false,
      });

      // The arguments go along, because the requested port is the fallback when the dev server
      // never reports the one it took.
      expect(holdDevServerLockAsync).toHaveBeenCalledWith(
        projectRoot,
        ['start', '--port', '8082'],
        expect.objectContaining({ since: expect.any(Number), isRunning: expect.any(Function) })
      );

      end(0);
      await promise;
    });

    it(`should report the dev server as running until it exits`, async () => {
      const end = mockLongRunningStart();
      const promise = runDevServerAsync(projectRoot, ['start'], { agentSkills: false });
      const { isRunning } = jest.mocked(holdDevServerLockAsync).mock.calls[0]![2];

      expect(isRunning?.()).toBe(true);

      end(0);
      await promise;
      expect(isRunning?.()).toBe(false);
    });

    it(`should release the lock when the dev server exits`, async () => {
      const lock = mockHeldLock();
      const end = mockLongRunningStart();
      const promise = runDevServerAsync(projectRoot, ['start'], { agentSkills: false });

      expect(lock.release).not.toHaveBeenCalled();

      end(0);
      await promise;
      expect(lock.release).toHaveBeenCalled();
    });

    it(`should release the lock when the dev server could not be spawned`, async () => {
      const lock = mockHeldLock();
      jest.mocked(runExpoAsync).mockRejectedValue(new Error('EXPO_CLI_NOT_FOUND'));

      await expect(
        runDevServerAsync(projectRoot, ['start'], { agentSkills: false })
      ).rejects.toThrow('EXPO_CLI_NOT_FOUND');
      expect(lock.release).toHaveBeenCalled();
    });

    it(`should run the dev server when no lock could be taken`, async () => {
      jest.mocked(holdDevServerLockAsync).mockResolvedValue(null);
      const end = mockLongRunningStart();
      const promise = runDevServerAsync(projectRoot, ['start'], { agentSkills: false });

      end(3);
      // The lock is a convenience; the exit code of the dev server is the answer either way.
      await expect(promise).resolves.toMatchObject({ exitCode: 3 });
    });
  });
});
