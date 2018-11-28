interface TaskBody {
    data: object;
    error: Error | null;
    executionInfo: {
        eventId: string;
        taskName: string;
    };
}
interface RegisteredTask {
    taskName: string;
    taskType: string;
    options: object;
}
declare type Task = (body: TaskBody) => void;
export declare function defineTask(taskName: string, task: Task): void;
export declare function isTaskDefined(taskName: string): boolean;
export declare function isTaskRegisteredAsync(taskName: string): Promise<boolean>;
export declare function getTaskOptionsAsync(taskName: string): Promise<object>;
export declare function getRegisteredTasksAsync(): Promise<Array<RegisteredTask>>;
export declare function unregisterTaskAsync(taskName: string): Promise<null>;
export declare function unregisterAllTasksAsync(): Promise<null>;
export {};
