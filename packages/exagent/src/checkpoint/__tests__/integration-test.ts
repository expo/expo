import * as Log from '../../log';
import { createCheckpointAsync } from '../create';
import { event } from '../events';
import { checkpointBeforeAsync, checkpointsEnabled } from '../integration';
import type { CheckpointResult } from '../types';

jest.mock('../../log');
jest.mock('../events', () => ({
  event: jest.fn(),
  debugEvent: Object.assign(jest.fn(), { error: jest.fn((error) => error) }),
}));
jest.mock('../create', () => ({
  ...jest.requireActual('../create'),
  createCheckpointAsync: jest.fn(),
}));

const projectRoot = '/repo';

function created(): CheckpointResult {
  return {
    record: {
      id: 'c0ffee1234567890',
      label: 'exagent install',
      createdAt: '2026-08-22T10:00:00.000Z',
      argv: ['exagent', 'install'],
      path: '',
    },
    files: 12,
    skipped: null,
    detail: 'the whole repository (12 files, git-tracked only)',
  };
}

/** Everything the command printed, joined into one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

/** Everything the command warned about, joined into one string. */
function warned(): string {
  return jest.mocked(Log.warn).mock.calls.flat().join('\n');
}

beforeEach(() => {
  delete process.env.EXAGENT_NO_CHECKPOINT;
  jest.mocked(createCheckpointAsync).mockResolvedValue(created());
});

describe(checkpointsEnabled, () => {
  it(`should be on by default`, () => {
    expect(checkpointsEnabled(undefined)).toBe(true);
    expect(checkpointsEnabled(true)).toBe(true);
  });

  it(`should be off for --no-checkpoint`, () => {
    expect(checkpointsEnabled(false)).toBe(false);
  });

  it(`should be off for EXAGENT_NO_CHECKPOINT`, () => {
    process.env.EXAGENT_NO_CHECKPOINT = '1';

    expect(checkpointsEnabled(undefined)).toBe(false);
  });
});

describe(checkpointBeforeAsync, () => {
  it(`should snapshot the project and print the id`, async () => {
    const result = await checkpointBeforeAsync(projectRoot, { label: 'exagent install' });

    expect(result.record?.id).toBe('c0ffee1234567890');
    expect(createCheckpointAsync).toHaveBeenCalledWith(projectRoot, { label: 'exagent install' });
    expect(printed()).toContain('c0ffee1');
    expect(printed()).toContain('npx exagent undo');
  });

  it(`should snapshot without printing when the caller owns stdout`, async () => {
    const result = await checkpointBeforeAsync(projectRoot, {
      label: 'exagent start --smart',
      silent: true,
    });

    expect(result.record?.id).toBe('c0ffee1234567890');
    expect(printed()).toBe('');
  });

  it(`should not snapshot when the run turned checkpoints off`, async () => {
    const result = await checkpointBeforeAsync(projectRoot, {
      label: 'exagent install',
      enabled: false,
    });

    expect(result.skipped).toBe('suppressed');
    expect(createCheckpointAsync).not.toHaveBeenCalled();
    expect(printed()).toBe('');
    expect(event).toHaveBeenCalledWith('skipped', {
      label: 'exagent install',
      reason: 'suppressed',
    });
  });

  it(`should say nothing when the project is not in a git repository`, async () => {
    jest.mocked(createCheckpointAsync).mockResolvedValue({
      record: null,
      files: 0,
      skipped: 'not-a-git-repo',
      detail: 'This project is not inside a git repository.',
    });

    const result = await checkpointBeforeAsync(projectRoot, { label: 'exagent install' });

    expect(result.skipped).toBe('not-a-git-repo');
    expect(printed()).toBe('');
    expect(warned()).toBe('');
  });

  it(`should warn but not fail when git could not snapshot`, async () => {
    jest.mocked(createCheckpointAsync).mockResolvedValue({
      record: null,
      files: 0,
      skipped: 'git-failed',
      detail: 'Git could not snapshot the project: index lock exists.',
    });

    const result = await checkpointBeforeAsync(projectRoot, { label: 'exagent install' });

    expect(result.skipped).toBe('git-failed');
    expect(warned()).toContain('index lock exists');
    expect(warned()).toContain('Continuing without a checkpoint');
  });
});
