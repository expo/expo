import { BackgroundFetchOptions, BackgroundFetchResult, BackgroundFetchStatus } from './BackgroundFetch.types';
export declare function getStatusAsync(): Promise<BackgroundFetchStatus | null>;
export declare function setMinimumIntervalAsync(minimumInterval: number): Promise<void>;
export declare function registerTaskAsync(taskName: string, options?: BackgroundFetchOptions): Promise<void>;
export declare function unregisterTaskAsync(taskName: string): Promise<void>;
export { BackgroundFetchResult as Result, BackgroundFetchStatus as Status };
