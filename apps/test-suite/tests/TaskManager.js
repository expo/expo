import { Location, TaskManager } from 'expo';

import * as TestUtils from '../TestUtils';

const DEFINED_TASK_NAME = 'defined task';
const UNDEFINED_TASK_NAME = 'undefined task';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;
  const locationOptions = {
    accuracy: Location.Accuracy.Low,
    showsBackgroundLocationIndicator: false,
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

    describeWithPermissions('isTaskRegisteredAsync()', async () => {
      t.beforeAll(async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME);
      });

      t.it('returns true for registered tasks', async () => {
        t.expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(true);
      });

      t.it('returns false for unregistered tasks', async () => {
        t.expect(await TaskManager.isTaskRegisteredAsync(UNDEFINED_TASK_NAME)).toBe(false);
      });

      t.afterAll(async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });

    describeWithPermissions('getTaskOptionsAsync()', async () => {
      let taskOptions;

      t.it('returns null for unregistered tasks', async () => {
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toBe(null);
      });

      t.it('returns correct options after register', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toEqual(t.jasmine.objectContaining(locationOptions));
      });

      t.it('returns null when unregistered', async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        t.expect(taskOptions).toBe(null);
      });
    });

    describeWithPermissions('getRegisteredTasksAsync()', async () => {
      let registeredTasks;

      t.it('returns empty object if there are no tasks', async () => {
        registeredTasks = await TaskManager.getRegisteredTasksAsync();
        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks[DEFINED_TASK_NAME]).toBeUndefined();
      });

      t.it('returns correct object after registering the task', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);

        registeredTasks = await TaskManager.getRegisteredTasksAsync();

        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks[DEFINED_TASK_NAME]).toEqual(
          t.jasmine.objectContaining(locationOptions)
        );
      });

      t.afterAll(async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });

    describeWithPermissions('unregisterAllTasksAsync()', async () => {
      t.it('unregisters tasks correctly', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);
        await TaskManager.unregisterAllTasksAsync();

        t.expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(false);
        t.expect(await Location.hasStartedLocationUpdatesAsync(DEFINED_TASK_NAME)).toBe(false);
      });
    });
  });
}

// Empty task so we can properly test some methods.
TaskManager.defineTask(DEFINED_TASK_NAME, () => {});
