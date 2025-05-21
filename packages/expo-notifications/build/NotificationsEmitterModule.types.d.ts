import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationResponse } from './Notifications.types';
export interface NotificationsEmitterModule extends ProxyNativeModule {
    getLastNotificationResponse?: () => NotificationResponse | null;
    clearLastNotificationResponse?: () => void;
}
//# sourceMappingURL=NotificationsEmitterModule.types.d.ts.map