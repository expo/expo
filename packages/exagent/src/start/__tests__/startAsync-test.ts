import { vol } from 'memfs';
import os from 'os';

import * as Log from '../../log';
import { autoSyncSkillsAsync } from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { resolveStartOptions } from '../resolveOptions';
import { runDevServerAsync, SKILLS_SYNC_IDLE_DELAY_MS, startAsync } from '../startAsync';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({ autoSyncSkillsAsync: jest.fn() }));

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

beforeEach(() => {
  jest.useFakeTimers();
  vol.reset();
  jest.mocked(autoSyncSkillsAsync).mockResolvedValue(undefined);
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
    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot);

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
    expect(printed()).toContain('Next:');
    expect(printed()).toContain('exp://192.168.1.5:8081');
    expect(printed()).toContain('npx exagent runtime errors');
    expect(printed()).toContain('npx eas build:configure');

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

  it(`should offer the production build when the project has an eas.json`, async () => {
    vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions([]));

    expect(printed()).toContain('npx eas build --profile production');

    end(0);
    await promise;
  });

  it(`should leave out the device hint when only the web bundle is served`, async () => {
    const end = mockLongRunningStart();
    const promise = startAsync(projectRoot, resolveStartOptions(['--web']));

    expect(printed()).toContain('Next:');
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
    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot);

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
});
