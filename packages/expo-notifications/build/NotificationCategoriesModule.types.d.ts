import { ProxyNativeModule } from 'expo-modules-core';
import { NotificationCategory, NotificationAction } from './Notifications.types';
export interface NotificationCategoriesModule extends ProxyNativeModule {
    getNotificationCategoriesAsync: () => Promise<NotificationCategory[]>;
    setNotificationCategoryAsync: (identifier: string, actions: NotificationAction[], options?: {
        previewPlaceholder?: string;
        intentIdentifiers?: string[];
        categorySummaryFormat?: string;
        customDismissAction?: boolean;
        allowInCarPlay?: boolean;
        showTitle?: boolean;
        showSubtitle?: boolean;
        allowAnnouncement?: boolean;
    }) => Promise<NotificationCategory>;
    deleteNotificationCategoryAsync: (identifier: string) => Promise<boolean>;
}
