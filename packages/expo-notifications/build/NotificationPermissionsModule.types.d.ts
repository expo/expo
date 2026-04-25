import type { ProxyNativeModule } from 'expo-modules-core';
import type { NotificationPermissionsStatus, NativeNotificationPermissionsRequest } from './NotificationPermissions.types';
export interface NotificationPermissionsModule extends ProxyNativeModule {
    getPermissionsAsync?: () => Promise<NotificationPermissionsStatus>;
    requestPermissionsAsync?: (request: NativeNotificationPermissionsRequest) => Promise<NotificationPermissionsStatus>;
}
//# sourceMappingURL=NotificationPermissionsModule.types.d.ts.map