import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import * as TestUtils from '../TestUtils';

const DEFINED_TASK_NAME = 'defined task';
const UNDEFINED_TASK_NAME = 'undefined task';

export const name = 'TaskManager';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;
  const locationOptions = {
    accuracy: Location.Accuracy.Low,
    showsBackgroundLocationIndicator: false,
  };
  /*
  Some of these tests cause Expo to crash on device farm with the following error:
  "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
  'java.util.Map org.unimodules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"

  getOptions() is being called from within LocationTaskConsumer.java in the expo-location module
  several times without checking for null
  */
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

      t.it('returns empty array if there are no tasks', async () => {
        registeredTasks = await TaskManager.getRegisteredTasksAsync();
        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks.length).toBe(0);
      });

      t.it('returns correct array after registering the task', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);

        registeredTasks = await TaskManager.getRegisteredTasksAsync();

        t.expect(registeredTasks).toBeDefined();
        t.expect(registeredTasks.length).toBe(1);
        t.expect(registeredTasks.find(task => task.taskName === DEFINED_TASK_NAME)).toEqual(
          t.jasmine.objectContaining({
            taskName: DEFINED_TASK_NAME,
            taskType: 'location',
            options: locationOptions,
          })
        );
      });

      t.afterAll(async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });

    describeWithPermissions('unregisterAllTasksAsync()', () => {
      t.it('unregisters tasks correctly', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);
        await TaskManager.unregisterAllTasksAsync();

        t.expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(false);
        t.expect((await TaskManager.getRegisteredTasksAsync()).length).toBe(0);
        t.expect(await Location.hasStartedLocationUpdatesAsync(DEFINED_TASK_NAME)).toBe(false);
      });
    });

    describeWithPermissions('rejections', () => {
      t.it('should reject when trying to unregister task with different consumer', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);

        let error;
        try {
          await Location.stopGeofencingAsync(DEFINED_TASK_NAME, locationOptions);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(error.message).toMatch(/Invalid task consumer/);

        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });
  });
}

// Empty task so we can properly test some methods.
TaskManager.defineTask(DEFINED_TASK_NAME, () => {});
