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
export interface RegisteredTask {
    taskName: string;
    taskType: string;
    options: any;
}
declare type Task = (body: TaskBody) => void;
export declare function defineTask(taskName: string, task: Task): void;
export declare function isTaskDefined(taskName: string): boolean;
export declare function isTaskRegisteredAsync(taskName: string): Promise<boolean>;
export declare function getTaskOptionsAsync<TaskOptions>(taskName: string): Promise<TaskOptions>;
export declare function getRegisteredTasksAsync(): Promise<RegisteredTask[]>;
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
export declare function unregisterAllTasksAsync(): Promise<void>;
export {};
