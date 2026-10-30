import ExpoTaskManager from '../ExpoTaskManager';
import * as TaskManager from '../TaskManager';

type TaskListener = (body: TaskManager.TaskManagerTaskBody) => Promise<void>;

let mockTaskListener: TaskListener | undefined;

jest.mock('expo-modules-core', () => ({
  ...jest.requireActual('expo-modules-core'),
  LegacyEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: (_eventName: string, listener: TaskListener) => {
      mockTaskListener = listener;
      return { remove() {} };
    },
  })),
}));

jest.mock('../ExpoTaskManager', () => ({
  __esModule: true,
  default: {
    EVENT_NAME: 'TaskManager.executeTask',
    notifyTaskFinishedAsync: jest.fn(() => Promise.resolve()),
    unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  },
}));

function executeTask(taskName: string): Promise<void> {
  if (!mockTaskListener) {
    throw new Error('TaskManager did not subscribe to task events.');
  }
  return mockTaskListener({
    data: { value: 1 },
    error: null,
    executionInfo: { eventId: 'event-1', taskName },
  });
}

describe('task execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Tests define tasks after the bundle has loaded, which TaskManager warns about.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports the value the executor resolved with', async () => {
    TaskManager.defineTask('resolves', async () => 'done');

    await executeTask('resolves');

    expect(ExpoTaskManager.notifyTaskFinishedAsync).toHaveBeenCalledWith('resolves', {
      eventId: 'event-1',
      result: 'done',
    });
  });

  it('reports the error the executor threw', async () => {
    TaskManager.defineTask('throws', async () => {
      throw new Error('Could not save the entry.');
    });

    await executeTask('throws');

    expect(ExpoTaskManager.notifyTaskFinishedAsync).toHaveBeenCalledWith('throws', {
      eventId: 'event-1',
      result: null,
      error: { code: 'ERR_TASK_EXECUTION_FAILED', message: 'Could not save the entry.' },
    });
  });

  it('reports the message of a thrown object that is not an Error', async () => {
    TaskManager.defineTask('throws-object', async () => {
      throw { message: 'Quota exceeded.' };
    });

    await executeTask('throws-object');

    expect(ExpoTaskManager.notifyTaskFinishedAsync).toHaveBeenCalledWith('throws-object', {
      eventId: 'event-1',
      result: null,
      error: { code: 'ERR_TASK_EXECUTION_FAILED', message: 'Quota exceeded.' },
    });
  });

  it('reports a thrown value that cannot be converted to a string', async () => {
    TaskManager.defineTask('throws-null-prototype', async () => {
      throw Object.create(null);
    });

    await executeTask('throws-null-prototype');

    expect(ExpoTaskManager.notifyTaskFinishedAsync).toHaveBeenCalledWith('throws-null-prototype', {
      eventId: 'event-1',
      result: null,
      error: { code: 'ERR_TASK_EXECUTION_FAILED', message: 'Unknown error' },
    });
  });

  it('reports a task that is not defined and then unregisters it', async () => {
    await executeTask('undefined-task');

    expect(ExpoTaskManager.notifyTaskFinishedAsync).toHaveBeenCalledWith('undefined-task', {
      eventId: 'event-1',
      result: null,
      error: {
        code: 'ERR_TASK_NOT_DEFINED',
        message: expect.stringContaining('TaskManager.defineTask'),
      },
    });
    expect(ExpoTaskManager.unregisterTaskAsync).toHaveBeenCalledWith('undefined-task');
  });
});
