import { ProxyNativeModule } from '@unimodules/core';
import { NotificationCategory } from './Notifications.types';
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
        allowAnnouncment?: boolean;
    }) => Promise<NotificationCategory>;
    deleteNotificationCategoryAsync: (identifier: string) => Promise<boolean>;
}
declare const _default: NotificationCategoriesModule;
export default _default;
