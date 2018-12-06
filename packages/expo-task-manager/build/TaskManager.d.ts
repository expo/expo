interface TaskError {
    code: string | number;
    message: string;
}
interface TaskBody {
    data: object;
    error: TaskError | null;
    executionInfo: {
        eventId: string;
        taskName: string;
    };
}
interface RegisteredTask {
    taskName: string;
    taskType: string;
    options: any;
}
declare type Task = (body: TaskBody) => void;
declare function defineTask(taskName: string, task: Task): void;
declare function isTaskDefined(taskName: string): boolean;
declare function isTaskRegisteredAsync(taskName: string): Promise<boolean>;
declare function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions>;
declare function getRegisteredTasksAsync(): Promise<RegisteredTask[]>;
declare function unregisterTaskAsync(taskName: string): Promise<void>;
declare function unregisterAllTasksAsync(): Promise<void>;
export declare const TaskManager: {
    defineTask: typeof defineTask;
    isTaskDefined: typeof isTaskDefined;
    isTaskRegisteredAsync: typeof isTaskRegisteredAsync;
    getTaskOptionsAsync: typeof getTaskOptionsAsync;
    getRegisteredTasksAsync: typeof getRegisteredTasksAsync;
    unregisterTaskAsync: typeof unregisterTaskAsync;
    unregisterAllTasksAsync: typeof unregisterAllTasksAsync;
};
export {};
