import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BackgroundTaskInfo,
  BackgroundTaskOptions,
  BackgroundTaskLogEntry,
} from './BackgroundTask.types';

const TASK_INFO_KEY = 'expo-background-task-info';
const TASK_LOG_KEY = 'expo-background-task-log';

const DEFAULT_INTERVAL_MINUTES = 60 * 24; // 24 hours - once every day

// @needsAudit
/**
 * Removes all tasks from the task repository
 * */
export const clearScheduledTasks = async () => {
  console.info(
    "BackgroundTaskRepository.cleanTasks should only be called if you really know what you're doing."
  );

  console.log('BackgroundTaskRepository.cleanRepository');
  await AsyncStorage.removeItem(TASK_INFO_KEY);
};

// @needsAudit
/**
 * Removes all task log items from the task repository
 * */
export const clearTaksLog = async () => {
  console.info(
    "BackgroundTaskRepository.cleanTaskLogItems should only be called if you really know what you're doing."
  );

  console.log('BackgroundTaskRepository.cleanRepository');
  await AsyncStorage.removeItem(TASK_LOG_KEY);
};

// @needsAudit
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export const createScheduledTaskInfo = async (
  taskIdentifier: string,
  options: BackgroundTaskOptions
) => {
  console.log('BackgroundTaskRepository.createTaskInfo', { taskIdentifier });
  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    throw Error(
      `BackgroundTask.createTaskInfo: 'taskIdentifier' argument must be a non-empty string.`
    );
  }

  if (!options || typeof options !== 'object') {
    throw Error(`BackgroundTask.saveTaskInfo: 'options' argument must be an object.`);
  }

  // Create task info
  const taskInfo: BackgroundTaskInfo = {
    intervalMinutes: DEFAULT_INTERVAL_MINUTES,
    ...options,
    taskIdentifier,
  };

  // Store task info
  const currentList = JSON.parse(
    (await AsyncStorage.getItem(TASK_INFO_KEY)) ?? '[]'
  ) as BackgroundTaskInfo[];
  currentList.push(taskInfo);
  await AsyncStorage.setItem(TASK_INFO_KEY, JSON.stringify(currentList));
  console.log('BackgroundTaskRepository.createTaskInfo - storing', { taskInfo });
  return taskInfo;
};

/**
 * Returns all task infos from the task repository
 * @returns List of task infos
 */
export const getScheduledTaskInfos = async () => {
  return JSON.parse((await AsyncStorage.getItem(TASK_INFO_KEY)) ?? '[]') as BackgroundTaskInfo[];
};

export const getScheduledTaskInfo = async (taskIdentifier: string) => {
  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    throw Error(
      `BackgroundTask.deleteTaskInfo: 'taskIdentifier' argument must be a non-empty string.`
    );
  }

  const taskInfos = await getScheduledTaskInfos();
  return taskInfos.find((t) => t.taskIdentifier === taskIdentifier) ?? null;
};

// @needsAudit
/**
 * Cancels a scheduled task by its identifier
 * @param taskIdentifier Identifier of task to cancel
 * @returns Deleted item(s)
 */
export const deleteScheduledTaskInfo = async (taskIdentifier: string) => {
  console.log('BackgroundTaskRepository.deleteTaskInfo', { taskIdentifier });
  if (!taskIdentifier || typeof taskIdentifier !== 'string') {
    throw Error(
      `BackgroundTask.deleteTaskInfo: 'taskIdentifier' argument must be a non-empty string.`
    );
  }
  // Delete from store!
  const currentList = JSON.parse(
    (await AsyncStorage.getItem(TASK_INFO_KEY)) ?? '[]'
  ) as BackgroundTaskInfo[];

  const deleted = currentList.splice(
    currentList.findIndex((t) => t.taskIdentifier === taskIdentifier),
    1
  );

  await AsyncStorage.setItem(TASK_INFO_KEY, JSON.stringify(currentList));
  return deleted;
};

// @needsAudit
/**
 * Logs task info to the task repository
 * @param taskRunInfo Task run info to log
 */
export const addLogItem = async (taskRunInfo: BackgroundTaskLogEntry) => {
  console.log('BackgroundTaskRepository.addTaskInfoLog', { taskRunInfo });
  if (!taskRunInfo || typeof taskRunInfo !== 'object') {
    throw Error(`BackgroundTask.storeTaskInfoRunInfo: 'taskRunInfo' argument must be an object.`);
  }

  if (!taskRunInfo.identifier || typeof taskRunInfo.identifier !== 'string') {
    throw Error(
      `BackgroundTask.storeTaskInfoRunInfo: 'taskIdentifier' argument must be a non-empty string.`
    );
  }

  // Store task run info
  const currentList = JSON.parse(
    (await AsyncStorage.getItem(TASK_LOG_KEY)) ?? '[]'
  ) as BackgroundTaskLogEntry[];
  currentList.push(taskRunInfo);
  await AsyncStorage.setItem(TASK_LOG_KEY, JSON.stringify(currentList));
};

// @needsAudit
/**
 * Returns the log for all tasks from the task repository
 * @returns Task run info log
 */
export const getLogItems = async () => {
  const logListJson = (await AsyncStorage.getItem(TASK_LOG_KEY)) ?? '[]';
  return JSON.parse(logListJson) as BackgroundTaskLogEntry[];
};
