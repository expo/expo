import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const DEFINED_TASK_NAME = 'defined task';
const UNDEFINED_TASK_NAME = 'undefined task';

export const name = 'TaskManager';

export async function test(t) {
  const backgroundFetchOptions = {
    minimumInterval: 15 * 60, // 15min in sec
    stopOnTerminate: false,
    startOnBoot: true,
  };

  t.describe('TaskManager', () => {
    t.describe('isTaskDefined()', () => {
      t.it('returns true if task is defined', () => {
        t.expect(TaskManager.isTaskDefined(DEFINED_TASK_NAME)).toBe(true);
      });
      t.it('returns false if task is not defined', () => {
        t.expect(TaskManager.isTaskDefined(UNDEFINED_TASK_NAME)).toBe(false);
      });
    });

    t.describe('isTaskRegisteredAsync()', async () => {
      t.beforeAll(async () => {
        await BackgroundFetch.registerTaskAsync(DEFINED_TASK_NAME);
      });

      t.it('returns true for registered tasks', async () => {
        t.expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(true);
      });

      t.it('returns false for unregistered tasks', async () => {
        t.expect(await TaskManager.isTaskRegisteredAsync(UNDEFINED_TASK_NAME)).toBe(false);
      });

      t.afterAll(async () => {
        await BackgroundFetch.unregisterTaskAsync(DEFINED_TASK_NAME);
      });
    });

    t.describe('getTaskOptionsAsync()', async () => {
      let taskOptions;

      t.it('returns null for unregistered tasks', async () => {
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toBe(null);
      });

      t.it('returns correct options after register', async () => {
        await BackgroundFetch.registerTaskAsync(DEFINED_TASK_NAME, backgroundFetchOptions);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toEqual(t.jasmine.objectContaining(backgroundFetchOptions));
      });

      t.it('returns null when unregistered', async () => {
        await BackgroundFetch.unregisterTaskAsync(DEFINED_TASK_NAME);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toBe(null);
      });
    });

    t.describe('getRegisteredTasksAsync()', async () => {
      let registeredTasks;

      t.it('returns empty array if there are no tasks', async () => {
        registeredTasks = await TaskManager.getRegisteredTasksAsync();
        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks.length).toBe(0);
      });

      t.it('returns correct array after registering the task', async () => {
        await BackgroundFetch.registerTaskAsync(DEFINED_TASK_NAME, backgroundFetchOptions);

        registeredTasks = await TaskManager.getRegisteredTasksAsync();

        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks.length).toBe(1);
        t.expect(registeredTasks.find((task) => task.taskName === DEFINED_TASK_NAME)).toEqual(
          t.jasmine.objectContaining({
            taskName: DEFINED_TASK_NAME,
            taskType: 'backgroundFetch',
            options: backgroundFetchOptions,
          })
        );
      });

      t.afterAll(async () => {
        await BackgroundFetch.unregisterTaskAsync(DEFINED_TASK_NAME);
      });
    });

    t.describe('unregisterAllTasksAsync()', () => {
      t.it('unregisters tasks correctly', async () => {
        await BackgroundFetch.registerTaskAsync(DEFINED_TASK_NAME, backgroundFetchOptions);
        await TaskManager.unregisterAllTasksAsync();

        t.expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(false);
        t.expect((await TaskManager.getRegisteredTasksAsync()).length).toBe(0);
      });
    });

    t.describe('rejections', () => {
      t.it('should reject when trying to unregister non-existing tasks', async () => {
        await BackgroundFetch.registerTaskAsync(DEFINED_TASK_NAME, backgroundFetchOptions);

        let error;
        try {
          await BackgroundFetch.unregisterTaskAsync(UNDEFINED_TASK_NAME);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(error.message).toMatch(/not found/);

        await BackgroundFetch.unregisterTaskAsync(DEFINED_TASK_NAME);
      });
    });
  });
}

// Empty task so we can properly test some methods.
// We are telling iOS that we successfully fetched new data, to prevent possible throttle from iOS
TaskManager.defineTask(DEFINED_TASK_NAME, () => BackgroundFetch.BackgroundFetchResult.NewData);
