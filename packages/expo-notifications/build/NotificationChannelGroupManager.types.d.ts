import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationChannel } from './NotificationChannelManager.types';
/**
 * An object which represents a notification channel group.
 * @platform android
 */
export interface NotificationChannelGroup {
    id: string;
    name: string | null;
    description?: string | null;
    isBlocked?: boolean;
    channels: NotificationChannel[];
}
/**
 * An object which represents a notification channel group to be set.
 * @platform android
 */
export interface NotificationChannelGroupInput {
    name: string | null;
    description?: string | null;
}
export interface NotificationChannelGroupManager extends ProxyNativeModule {
    getNotificationChannelGroupsAsync?: () => Promise<NotificationChannelGroup[]>;
    getNotificationChannelGroupAsync?: (groupId: string) => Promise<NotificationChannelGroup | null>;
    setNotificationChannelGroupAsync?: (groupId: string, group: NotificationChannelGroupInput) => Promise<NotificationChannelGroup | null>;
    deleteNotificationChannelGroupAsync?: (groupId: string) => Promise<void>;
}
//# sourceMappingURL=NotificationChannelGroupManager.types.d.ts.map