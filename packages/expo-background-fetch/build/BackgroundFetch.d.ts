declare enum BackgroundFetchResult {
    NoData = 1,
    NewData = 2,
    Failed = 3
}
declare enum BackgroundFetchStatus {
    Denied = 1,
    Restricted = 2,
    Available = 3
}
export declare function getStatusAsync(): Promise<BackgroundFetchStatus | null>;
export declare function setMinimumIntervalAsync(minimumInterval: number): Promise<void>;
export declare function registerTaskAsync(taskName: string): Promise<void>;
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
export { BackgroundFetchResult as Result, BackgroundFetchStatus as Status, };
