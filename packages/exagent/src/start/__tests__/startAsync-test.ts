import { autoSyncSkillsAsync } from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { resolveStartOptions } from '../resolveOptions';
import { runDevServerAsync, SKILLS_SYNC_IDLE_DELAY_MS, startAsync } from '../startAsync';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({ autoSyncSkillsAsync: jest.fn() }));

const projectRoot = '/project';

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
  jest.mocked(autoSyncSkillsAsync).mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
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
