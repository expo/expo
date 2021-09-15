import { ProxyNativeModule } from 'expo-modules-core';
export interface BackgroundNotificationTasksModule extends ProxyNativeModule {
    registerTaskAsync: (taskName: string) => Promise<null>;
    unregisterTaskAsync: (taskName: string) => Promise<null>;
}
export declare enum BackgroundNotificationResult {
    NoData = 1,
    NewData = 2,
    Failed = 3
}
