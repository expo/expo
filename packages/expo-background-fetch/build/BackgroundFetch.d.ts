declare enum Result {
    NoData = 1,
    NewData = 2,
    Failed = 3
}
declare enum Status {
    Denied = 1,
    Restricted = 2,
    Available = 3
}
declare function getStatusAsync(): Promise<Status | void>;
declare function setMinimumIntervalAsync(minimumInterval: number): Promise<void>;
declare function registerTaskAsync(taskName: string): Promise<void>;
declare function unregisterTaskAsync(taskName: string): Promise<void>;
export declare const BackgroundFetch: {
    Result: typeof Result;
    Status: typeof Status;
    getStatusAsync: typeof getStatusAsync;
    setMinimumIntervalAsync: typeof setMinimumIntervalAsync;
    registerTaskAsync: typeof registerTaskAsync;
    unregisterTaskAsync: typeof unregisterTaskAsync;
};
export {};
