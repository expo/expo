import { ProxyNativeModule } from 'expo-modules-core';
export interface BackgroundNotificationTasksModule extends ProxyNativeModule {
    registerTaskAsync: (taskName: string) => Promise<null>;
    unregisterTaskAsync: (taskName: string) => Promise<null>;
}
//# sourceMappingURL=BackgroundNotificationTasksModule.types.d.ts.map