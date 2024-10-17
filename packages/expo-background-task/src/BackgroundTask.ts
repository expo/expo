import { UnavailabilityError } from 'expo-modules-core';

import {
  BackgroundTaskExecutor,
  BackgroundTaskInfoStatus,
  BackgroundTaskOptions,
  BackgroundTaskStatus,
  BackgroundTaskType,
} from './BackgroundTask.types';
import * as BackgroundTaskRepositiory from './BackgroundTaskRepository';
import ExpoBackgroundTaskModule from './ExpoBackgroundTaskModule';

// Export types
export {
  BackgroundTaskStatus,
  BackgroundTaskInfoStatus,
  BackgroundTaskInfo,
  BackgroundTaskType,
  BackgroundTaskLogEntry,
} from './BackgroundTask.types';

const initialize = async () => {
  // Tell the native module we're ready to receive events
  if (!ExpoBackgroundTaskModule.initialiseFromJS) {
    throw new UnavailabilityError('BackgroundTask', 'initialiseFromJS');
  }

  console.log('BackgroundTask: Initializing from JS');
  ExpoBackgroundTaskModule.initialiseFromJS();

  // Start worker if it's not running and we have tasks registered
  console.log('BackgroundTask: Checking if we have any scheduled tasks');
  BackgroundTaskRepositiory.getScheduledTaskInfos().then((taskInfos) => {
    if (taskInfos.length > 0) {
      console.log(`BackgroundTask: ${taskInfos.length} tasks scheduled`);
      ExpoBackgroundTaskModule.isWorkerRunningAsync().then((isRunning) => {
        if (!isRunning) {
          console.log('BackgroundTask: Starting worker');
          ExpoBackgroundTaskModule.startWorkerAsync().then(() => {
            console.log('BackgroundTask: worker running');
          });
        } else {
          console.log('BackgroundTask: worker running');
        }
      });
    } else {
      ExpoBackgroundTaskModule.isWorkerRunningAsync().then((isRunning) => {
        if (isRunning) {
          console.log('BackgroundTask: Stopping worker, we have no scheduled tasks.');
          ExpoBackgroundTaskModule.stopWorkerAsync().then(() => {
            console.log('BackgroundTask: worker stopped');
          });
        } else {
          console.log('BackgroundTask: worker not running');
        }
      });
    }
  });
};

// @needsAudit
/**
 * defines the list of tasks used to store background tasks
 */
const tasks: Map<string, BackgroundTaskExecutor> = new Map<string, BackgroundTaskExecutor>();

// @needsAudit
/**
 * Creates a new backgound task
 * @param taskIdentifier Identifier of the task
 * @param taskExecutor Executor for the task
 */
export const createTask = (taskIdentifier: string, taskExecutor: BackgroundTaskExecutor) => {
  console.log('BackgroundTask.createTask', { taskIdentifier });
  tasks.set(taskIdentifier, taskExecutor);
};

// @needsAudit
/**
 * Schedules a registered task
 * @param taskIdentifier
 * @param options
 */
export const scheduleTaskAsync = async (taskIdentifier: string, options: BackgroundTaskOptions) => {
  console.log('BackgroundTask.scheduleTaskAsync', { taskIdentifier, options });

  if (!ExpoBackgroundTaskModule.startWorkerAsync) {
    throw new UnavailabilityError('BackgroundTask', 'scheduleTaskAsync');
  }

  if (!ExpoBackgroundTaskModule.isWorkerRunningAsync) {
    throw new UnavailabilityError('BackgroundTask', 'isWorkerRunningAsync');
  }

  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    console.warn(
      `BackgroundTask.scheduleTaskAsync: 'taskIdentifier' argument must be a non-empty string.`
    );
    return;
  }

  if (!tasks.has(taskIdentifier)) {
    console.warn(`BackgroundTask.scheduleTaskAsync: Task '${taskIdentifier}' is not defined.`);
    return;
  }

  // Schedule the task! meaning that we need to save info about the task being running
  const taskInfo = await BackgroundTaskRepositiory.createScheduledTaskInfo(taskIdentifier, options);
  console.info(`BackgroundTask.scheduleTaskAsync: Task '${taskInfo}' created.`);

  // Start worker if it's not running
  if (!(await ExpoBackgroundTaskModule.isWorkerRunningAsync())) {
    console.log('BackgroundTask.scheduleTaskAsync: Starting native worker.');
    await ExpoBackgroundTaskModule.startWorkerAsync();
  }

  // Add log item for the task
  await BackgroundTaskRepositiory.addLogItem({
    identifier: taskIdentifier,
    date: Date.now(),
    duration: 0,
    status: BackgroundTaskInfoStatus.Enqueued,
  });
};

// @needsAudit
/**
 * Cancels a scheduled task by its identifier
 *
 * @param taskIdentifier Identifier of task to cancel
 */

export const cancelScheduledTaskAsync = async (taskIdentifier: string) => {
  console.log('BackgroundTask.cancelTaskAsync', { taskIdentifier });

  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    console.warn(
      `BackgroundTask.cancelTaskAsync: 'taskIdentifier' argument must be a non-empty string.`
    );
    return;
  }
  // Get the task info
  const taskInfo = await BackgroundTaskRepositiory.getScheduledTaskInfo(taskIdentifier);
  if (!taskInfo) {
    console.warn(`BackgroundTask.cancelTaskAsync: Task '${taskIdentifier}' is not scheduled.`);
    return;
  }

  // Delete the task
  await deleteTaskAsync(taskIdentifier);

  // Add log item for the task
  await BackgroundTaskRepositiory.addLogItem({
    identifier: taskIdentifier,
    date: Date.now(),
    duration: 0,
    status: BackgroundTaskInfoStatus.Cancelled,
  });
};

// @needsAudit
/**
 * Returns the status for the Background Task API. On web, it always returns `BackgroundTaskStatus.Restricted`,
 * while on native platforms it returns `BackgroundTaskStatus.Available`. There is
 *
 * @returns A BackgroundTaskStatus enum value or null if not available.
 */
export const getStatusAsync = async (): Promise<BackgroundTaskStatus> => {
  if (!ExpoBackgroundTaskModule.getStatusAsync) {
    throw new UnavailabilityError('BackgroundTask', 'getStatusAsync');
  }

  return ExpoBackgroundTaskModule.getStatusAsync();
};

// @needsAudit
/**
 * Checks whether the task is registered using the createTask method
 *
 * @param taskIdentifier Identifier of task to check
 */
export const isTaskRegisteredAsync = async (taskIdentifier: string): Promise<boolean> => {
  return tasks.has(taskIdentifier);
};

// @needsAudit
/**
 * Returns true if the task is scheduled. By is scheduled we mean that the task is scheduled to
 * run in the future.
 * @param taskIdentifier Identifier of the task to check
 * @returns True if the task is scheduled
 */
export const isTaskScheduled = async (taskIdentifier: string): Promise<boolean> => {
  if (!isTaskRegisteredAsync(taskIdentifier)) {
    console.warn(
      `Task with identifier ${taskIdentifier} is not registered. Use createTask to register the task.`
    );
  }

  return (await BackgroundTaskRepositiory.getScheduledTaskInfo(taskIdentifier)) != null;
};

/**
 * Returns task log from the task repository for a given task
 * @param taskIdentifier Identifier of the task to get log
 * @returns Task log
 */
export const getTaskLogItems = async (taskIdentifier: string) => {
  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    console.warn(
      `BackgroundTask.getTaskInfoLog: 'taskIdentifier' argument must be a non-empty string.`
    );
    return;
  }

  return (await BackgroundTaskRepositiory.getLogItems()).filter(
    (t) => t.identifier === taskIdentifier
  );
};

/**
 * Returns task log from the task repository for a given task
 * @returns Task log
 */
export const getLogItems = async () => {
  return await BackgroundTaskRepositiory.getLogItems();
};

/**
 * Returns the task info from the task repository
 * @param taskIdentifier Identifier of the task to get info for
 * @returns Task info or null if not found
 */
export const getScheduledTaskInfo = async (taskIdentifier: string) => {
  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    console.warn(
      `BackgroundTask.getTaskInfoLog: 'taskIdentifier' argument must be a non-empty string.`
    );
    return;
  }

  return await BackgroundTaskRepositiory.getScheduledTaskInfo(taskIdentifier);
};

/**
 * Returns all task infos from the task repository
 * @returns List of Task infos
 */
export const getScheduledTaskInfos = async () => {
  return await BackgroundTaskRepositiory.getScheduledTaskInfos();
};

// @needsAudit
/**
 * Returns true/false if the background task worker is active.
 *
 * @returns True if the worker is running
 */
export const isWorkerRunning = (): Promise<boolean> => {
  if (!ExpoBackgroundTaskModule.isWorkerRunningAsync) {
    throw new UnavailabilityError('BackgroundTask', 'isWorkerRunningAsync');
  }
  return ExpoBackgroundTaskModule.isWorkerRunningAsync();
};

// @needsAudit
/**
 * Clears up the repository of scheduled tasks with logs
 */
export const clearScheduledTasks = async () => {
  console.log('BackgroundTask.cleanScheduledTasks');

  if (!ExpoBackgroundTaskModule.stopWorkerAsync) {
    throw new UnavailabilityError('BackgroundTask', 'stopWorkerAsync');
  }

  if (!ExpoBackgroundTaskModule.isWorkerRunningAsync) {
    throw new UnavailabilityError('BackgroundTask', 'isWorkerRunningAsync');
  }

  await BackgroundTaskRepositiory.clearScheduledTasks();

  // Stop worker if running
  if (await ExpoBackgroundTaskModule.isWorkerRunning()) {
    await ExpoBackgroundTaskModule.stopWorkerAsync();
  }
};

// @needsAudit
/**
 * Cleans up the repository of scheduled tasks with logs
 */
export const clearTaskLog = async () => {
  console.log('BackgroundTask.cleanScheduledTasks');

  if (!ExpoBackgroundTaskModule.stopWorkerAsync) {
    throw new UnavailabilityError('BackgroundTask', 'stopWorkerAsync');
  }

  if (!ExpoBackgroundTaskModule.isWorkerRunningAsync) {
    throw new UnavailabilityError('BackgroundTask', 'isWorkerRunningAsync');
  }

  await BackgroundTaskRepositiory.clearTaksLog();
};

/**
 * Internal method for deleting a scheduled task
 * @param taskIdentifier Identifier of the task to stop
 */
const deleteTaskAsync = async (taskIdentifier: string) => {
  console.log('BackgroundTask.deleteTaskAsync', { taskIdentifier });

  if (!ExpoBackgroundTaskModule.stopWorkerAsync) {
    throw new UnavailabilityError('BackgroundTask', 'stopWorkerAsync');
  }

  if (!ExpoBackgroundTaskModule.workFinished) {
    throw new UnavailabilityError('BackgroundTask', 'workFinished');
  }

  if (!ExpoBackgroundTaskModule.isWorkerRunningAsync) {
    throw new UnavailabilityError('BackgroundTask', 'isWorkerRunningAsync');
  }

  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    console.warn(
      `BackgroundTask.stopTaskAsync: 'taskIdentifier' argument must be a non-empty string.`
    );
    return;
  }

  // Remove from repository
  const deletedTasks = await BackgroundTaskRepositiory.deleteScheduledTaskInfo(taskIdentifier);
  console.log('BackgroundTask.deleteTaskAsync', 'deleted tasks:', deletedTasks.length);

  // Stop the worker task if there are no task scheduled
  if (
    (await BackgroundTaskRepositiory.getScheduledTaskInfos()).length === 0 &&
    (await ExpoBackgroundTaskModule.isWorkerRunningAsync())
  ) {
    console.log('BackgroundTask.cancelTaskAsync: Stopping worker as there are no tasks scheduled.');
    await ExpoBackgroundTaskModule.stopWorkerAsync();
  }
};

// @needsAudit
/**
 * Adds a listener for the onPerformWork event
 * @param cb Callback to be called when the event is triggered
 * @returns An unsubscribe method
 */
export const addOnWorkListener = (cb: () => void) => {
  if (ExpoBackgroundTaskModule.EVENT_WORK_DONE !== 'onWorkDone') {
    throw new Error(
      "Expected 'onWorkDone' got '" +
        ExpoBackgroundTaskModule.EVENT_WORK_DONE +
        "' when adding event listener."
    );
  }

  return ExpoBackgroundTaskModule.addListener('onWorkDone', cb);
};

/**
 * Set up event emitter for the Background Task Manager
 */
if (ExpoBackgroundTaskModule) {
  console.log(
    'BackgroundTask: Setting up event listener for',
    ExpoBackgroundTaskModule.EVENT_PERFORM_WORK
  );

  // Ensure all events have the correct names from our types
  if (ExpoBackgroundTaskModule.EVENT_PERFORM_WORK !== 'onPerformWork') {
    throw new Error(
      "Expected 'onPerformWork' got '" +
        ExpoBackgroundTaskModule.EVENT_PERFORM_WORK +
        "' when adding event listener."
    );
  }

  // Listen to the onPerformWork event
  ExpoBackgroundTaskModule.addListener('onPerformWork', async () => {
    // We are notified by our native module that we can perform some work.
    // Lets check if we have any tasks to run.
    console.log(`BackgroundTask.${ExpoBackgroundTaskModule.EVENT_PERFORM_WORK}`, {
      taskCount: tasks.size,
    });

    try {
      tasks.forEach(async (taskExecutor, taskIdentifier) => {
        const start = Date.now();
        let error: string | null = null;
        try {
          await taskExecutor();
        } catch (e) {
          error = JSON.stringify(e);
        }

        const end = Date.now();

        // Log
        if (error !== null) {
          console.error(`BackgroundTask.runTask: '${taskIdentifier}' failed: ${error}`);
          BackgroundTaskRepositiory.addLogItem({
            identifier: taskIdentifier,
            date: start,
            duration: end - start,
            status: BackgroundTaskInfoStatus.Failed,
            error,
          });
        } else {
          console.log(`BackgroundTask.runTask: '${taskIdentifier}' completed in ${end - start}ms`);
          BackgroundTaskRepositiory.addLogItem({
            identifier: taskIdentifier,
            date: start,
            duration: end - start,
            status: BackgroundTaskInfoStatus.Success,
          });

          // Check if this is a one-time task
          const taskInfo = await BackgroundTaskRepositiory.getScheduledTaskInfo(taskIdentifier);
          if (taskInfo && taskInfo.type === BackgroundTaskType.OneTime) {
            // Remove the task
            await deleteTaskAsync(taskIdentifier);

            // Add log entry
            BackgroundTaskRepositiory.addLogItem({
              identifier: taskIdentifier,
              date: start,
              duration: end - start,
              status: BackgroundTaskInfoStatus.Stopped,
            });
          }
        }
      });
    } catch (e) {
      console.log('Expo BackgroundTask: An error occurred while running the task', e);
    }

    // Tell the native module that we are done
    await ExpoBackgroundTaskModule.workFinished();
  });
} else {
  throw new UnavailabilityError('BackgroundTask', 'ExpoBackgroundTaskModule');
}

// Initialise the module
initialize();
