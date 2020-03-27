import { ProxyNativeModule } from '@unimodules/core';
import { NotificationRequest } from './NotificationPresenter.types';
import { Notification } from './NotificationsEmitter.types';
export interface NotificationPresenterModule extends ProxyNativeModule {
    getPresentedNotificationsAsync: () => Promise<Notification[]>;
    presentNotificationAsync: (identifier: string, notificationRequest: NotificationRequest) => Promise<void>;
    dismissNotificationAsync: (identifier: string) => Promise<void>;
    dismissAllNotificationsAsync: () => Promise<void>;
}
declare const _default: NotificationPresenterModule;
export default _default;
