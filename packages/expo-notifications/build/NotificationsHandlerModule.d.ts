import { ProxyNativeModule } from '@unimodules/core';
export interface BaseNotificationBehavior {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
}
export interface AndroidNotificationBehavior extends BaseNotificationBehavior {
    priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}
export interface IosNotificationBehavior extends BaseNotificationBehavior {
}
export declare type NativeNotificationBehavior = AndroidNotificationBehavior | IosNotificationBehavior;
export interface NotificationsHandlerModule extends ProxyNativeModule {
    handleNotificationAsync: (notificationId: string, notificationBehavior: NativeNotificationBehavior) => Promise<void>;
}
declare const _default: NotificationsHandlerModule;
export default _default;
