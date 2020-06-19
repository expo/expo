import { NotificationCategory } from './Notifications.types';
export default function setNotificationCategoryAsync(identifier: string, actions: NotificationAction[], options?: {
    previewPlaceholder?: string;
    intentIdentifiers?: string[];
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    allowAnnouncment?: boolean;
}): Promise<NotificationCategory>;
