export declare enum Result {
    NoData = 1,
    NewData = 2,
    Failed = 3
}
export declare enum Status {
    Denied = 1,
    Restricted = 2,
    Available = 3
}
export declare function getStatusAsync(): Promise<Status | null>;
export declare function setMinimumIntervalAsync(minimumInterval: number): Promise<null>;
export declare function registerTaskAsync(taskName: string): Promise<null>;
export declare function unregisterTaskAsync(taskName: string): Promise<null>;
