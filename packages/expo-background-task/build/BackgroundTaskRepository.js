import AsyncStorage from '@react-native-async-storage/async-storage';
const TASK_INFO_STORE_KEY = 'expo-background-task-info';
const getTaskInfoKey = (taskIdentifier) => `${TASK_INFO_STORE_KEY}:${taskIdentifier}`;
const TASK_INFO_RUN_INFO_STORE_KEY = 'expo-background-task-info-run_info';
const getTaskRunInfoKey = (taskIdentifier) => `${TASK_INFO_RUN_INFO_STORE_KEY}:${taskIdentifier}`;
const TASK_INFO_IDENTIFIER_LIST_STORE_KEY = 'expo-background-task-info-identifier_list';
const DEFAULT_INTERVAL_MINUTES = 60 * 24; // 24 hours - once every day
// @needsAudit
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export const cleanRepository = async () => {
    console.info("BackgroundTaskRepository.cleanRepository should only be called if you really know what you're doing.");
    const taskIdenfiers = await getIdentifierList();
    console.log('BackgroundTaskRepository.cleanRepository', { taskIdenfiers });
    //   await AsyncStorage.removeItem(getTaskInfoKey('background-task'));
    //   await AsyncStorage.removeItem(getTaskRunInfoKey('background-task'));
    if (taskIdenfiers) {
        for (const identifier of taskIdenfiers) {
            console.log('BackgroundTaskRepository.cleanRepository - deleting', { identifier });
            await AsyncStorage.removeItem(getTaskInfoKey(identifier));
            await AsyncStorage.removeItem(getTaskRunInfoKey(identifier));
        }
        console.log('BackgroundTaskRepository.cleanRepository - deleting identifiers');
        setIdentifierList([]);
    }
};
// @needsAudit
/**
 * When creating a new task, we need to save the task info to the database.
 * @param taskIdentifier Identifier of the task
 * @param options Options for the task
 * */
export const createTaskInfo = async (taskIdentifier, options) => {
    console.log('BackgroundTaskRepository.createTaskInfo', { taskIdentifier });
    if (!taskIdentifier || typeof taskIdentifier !== 'string') {
        throw Error(`BackgroundTask.createTaskInfo: 'taskIdentifier' argument must be a non-empty string.`);
    }
    if (!options || typeof options !== 'object') {
        throw Error(`BackgroundTask.saveTaskInfo: 'options' argument must be an object.`);
    }
    // Create task info
    const taskInfo = {
        intervalMinutes: DEFAULT_INTERVAL_MINUTES,
        ...options,
        taskIdentifier,
    };
    // Store task info
    await AsyncStorage.setItem(getTaskInfoKey(taskIdentifier), JSON.stringify(taskInfo));
    console.log('BackgroundTaskRepository.createTaskInfo - storing', { taskInfo });
    // Update list of identifiers
    const identifierList = [...(await getIdentifierList()), taskIdentifier];
    await setIdentifierList(identifierList);
    return identifierList.length;
};
// @needsAudit
/**
 * Logs task info to the task repository
 * @param taskIdentifier Identifier to log
 * @param taskRunInfo Task run info to log
 */
export const addTaskInfoLog = async (taskIdentifier, taskRunInfo) => {
    console.log('BackgroundTaskRepository.addTaskInfoLog', { taskIdentifier, taskRunInfo });
    if (!taskIdentifier || typeof taskIdentifier !== 'string') {
        throw Error(`BackgroundTask.storeTaskInfoRunInfo: 'taskIdentifier' argument must be a non-empty string.`);
    }
    if (!taskRunInfo || typeof taskRunInfo !== 'object') {
        throw Error(`BackgroundTask.storeTaskInfoRunInfo: 'taskRunInfo' argument must be an object.`);
    }
    // Store task run info
    const logListJson = (await AsyncStorage.getItem(getTaskRunInfoKey(taskIdentifier))) ?? '[]';
    const logList = JSON.parse(logListJson);
    logList.push(taskRunInfo);
    await AsyncStorage.setItem(getTaskRunInfoKey(taskIdentifier), JSON.stringify(logList));
};
// @needsAudit
/**
 * Returns the log for a task from the task repository
 * @param taskIdentifier
 * @returns Task run info log
 */
export const getTaskInfoLog = async (taskIdentifier) => {
    if (!taskIdentifier || typeof taskIdentifier !== 'string') {
        throw Error(`BackgroundTask.getTaskInfoLog: 'taskIdentifier' argument must be a non-empty string.`);
    }
    const logListJson = (await AsyncStorage.getItem(getTaskRunInfoKey(taskIdentifier))) ?? '[]';
    return JSON.parse(logListJson);
};
// @needsAudit
/**
 * Cancels a scheduled task by its identifier
 * @param taskIdentifier Identifier of task to cancel
 * @returns Number of tasks left in the list
 */
export const deleteTaskInfo = async (taskIdentifier) => {
    console.log('BackgroundTaskRepository.deleteTaskInfo', { taskIdentifier });
    if (!taskIdentifier || typeof taskIdentifier !== 'string') {
        throw Error(`BackgroundTask.deleteTaskInfo: 'taskIdentifier' argument must be a non-empty string.`);
    }
    // Delete from store!
    await AsyncStorage.removeItem(getTaskInfoKey(taskIdentifier));
    // Update list of identifiers
    const identifierList = (await getIdentifierList()).filter((id) => id !== taskIdentifier);
    await setIdentifierList(identifierList);
    console.log('BackgroundTaskRepository.deleteTaskInfo', { identifierList });
    return identifierList.length;
};
/**
 * Returns task info from the task repository
 * @param taskIdentifier Identifier of the task to get info for
 * @returns Task info or null if not found
 */
export const getTaskInfo = async (taskIdentifier) => {
    if (!taskIdentifier || typeof taskIdentifier !== 'string') {
        throw Error(`BackgroundTask.getTaskInfo: 'taskIdentifier' argument must be a non-empty string.`);
    }
    const taskInfo = await AsyncStorage.getItem(getTaskInfoKey(taskIdentifier));
    if (!taskInfo) {
        return null;
    }
    return JSON.parse(taskInfo);
};
/**
 * Returns all task identifiers stored in the task repository. This includes all tasks that are
 * scheduled to run or have been run for one-time tasks.
 */
export const getTaskIdentifiers = async () => getIdentifierList();
/**
 * Internal accessor for getting the list of identifiers
 */
const getIdentifierList = async () => {
    const identifiersValue = (await AsyncStorage.getItem(TASK_INFO_IDENTIFIER_LIST_STORE_KEY)) ?? '[]';
    return JSON.parse(identifiersValue);
};
/**
 *  Internal setter for the list of identifiers
 * @param identifiers List of identifiers
 */
const setIdentifierList = async (identifiers) => {
    console.log('BackgroundTaskRepository.setIdentifierList', { identifiers });
    await AsyncStorage.setItem(TASK_INFO_IDENTIFIER_LIST_STORE_KEY, JSON.stringify(identifiers));
};
//# sourceMappingURL=BackgroundTaskRepository.js.map