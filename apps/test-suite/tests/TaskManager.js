import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import * as TestUtils from '../TestUtils';

const DEFINED_TASK_NAME = 'defined task';
const UNDEFINED_TASK_NAME = 'undefined task';

export const name = 'TaskManager';

export function canRunAsync({ isAutomated }) {
  // "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
  // 'java.util.Map org.unimodules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"
  return !isAutomated;
}

export async function test({
  beforeAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  afterAll,
  fail,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;
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
  describe('TaskManager', () => {
    describe('isTaskDefined()', () => {
      it('returns true if task is defined', () => {
        expect(TaskManager.isTaskDefined(DEFINED_TASK_NAME)).toBe(true);
      });
      it('returns false if task is not defined', () => {
        expect(TaskManager.isTaskDefined(UNDEFINED_TASK_NAME)).toBe(false);
      });
    });

    describeWithPermissions('isTaskRegisteredAsync()', async () => {
      beforeAll(async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME);
      });

      it('returns true for registered tasks', async () => {
        expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(true);
      });

      it('returns false for unregistered tasks', async () => {
        expect(await TaskManager.isTaskRegisteredAsync(UNDEFINED_TASK_NAME)).toBe(false);
      });

      afterAll(async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });

    describeWithPermissions('getTaskOptionsAsync()', async () => {
      let taskOptions;

      it('returns null for unregistered tasks', async () => {
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        expect(taskOptions).toBe(null);
      });

      it('returns correct options after register', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        expect(taskOptions).toEqual(jasmine.objectContaining(locationOptions));
      });

      it('returns null when unregistered', async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
        taskOptions = await TaskManager.getTaskOptionsAsync(DEFINED_TASK_NAME);
        expect(taskOptions).toBe(null);
      });
    });

    describeWithPermissions('getRegisteredTasksAsync()', async () => {
      let registeredTasks;

      it('returns empty array if there are no tasks', async () => {
        registeredTasks = await TaskManager.getRegisteredTasksAsync();
        expect(registeredTasks).toBeDefined();
        expect(registeredTasks.length).toBe(0);
      });

      it('returns correct array after registering the task', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);

        registeredTasks = await TaskManager.getRegisteredTasksAsync();

        expect(registeredTasks).toBeDefined();
        expect(registeredTasks.length).toBe(1);
        expect(registeredTasks.find(task => task.taskName === DEFINED_TASK_NAME)).toEqual(
          jasmine.objectContaining({
            taskName: DEFINED_TASK_NAME,
            taskType: 'location',
            options: locationOptions,
          })
        );
      });

      afterAll(async () => {
        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });

    describeWithPermissions('unregisterAllTasksAsync()', () => {
      it('unregisters tasks correctly', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);
        await TaskManager.unregisterAllTasksAsync();

        expect(await TaskManager.isTaskRegisteredAsync(DEFINED_TASK_NAME)).toBe(false);
        expect((await TaskManager.getRegisteredTasksAsync()).length).toBe(0);
        expect(await Location.hasStartedLocationUpdatesAsync(DEFINED_TASK_NAME)).toBe(false);
      });
    });

    describeWithPermissions('rejections', () => {
      it('should reject when trying to unregister task with different consumer', async () => {
        await Location.startLocationUpdatesAsync(DEFINED_TASK_NAME, locationOptions);

        let error;
        try {
          await Location.stopGeofencingAsync(DEFINED_TASK_NAME, locationOptions);
        } catch (e) {
          error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatch(/Invalid task consumer/);

        await Location.stopLocationUpdatesAsync(DEFINED_TASK_NAME);
      });
    });
  });
}

// Empty task so we can properly test some methods.
TaskManager.defineTask(DEFINED_TASK_NAME, () => {});
