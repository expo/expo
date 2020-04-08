import { ProxyNativeModule } from '@unimodules/core';
import { NotificationPermissionsStatus, NativeNotificationPermissionsRequest } from './NotificationPermissions.types';
export interface NotificationPermissionsModule extends ProxyNativeModule {
    getPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
    requestPermissionsAsync: (request: NativeNotificationPermissionsRequest) => Promise<NotificationPermissionsStatus>;
}
declare const _default: NotificationPermissionsModule;
export default _default;
