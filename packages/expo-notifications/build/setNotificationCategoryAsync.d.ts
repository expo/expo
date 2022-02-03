import { NotificationCategory, NotificationAction } from './Notifications.types';
export default function setNotificationCategoryAsync(identifier: string, actions: NotificationAction[], options?: {
    previewPlaceholder?: string;
    intentIdentifiers?: string[];
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    allowAnnouncement?: boolean;
}): Promise<NotificationCategory>;
//# sourceMappingURL=setNotificationCategoryAsync.d.ts.map