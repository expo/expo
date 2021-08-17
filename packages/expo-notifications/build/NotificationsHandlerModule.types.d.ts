import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationBehavior } from './Notifications.types';
export interface NotificationsHandlerModule extends ProxyNativeModule {
    handleNotificationAsync?: (notificationId: string, notificationBehavior: NotificationBehavior) => Promise<void>;
}
