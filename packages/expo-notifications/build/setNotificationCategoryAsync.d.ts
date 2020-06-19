import { NotificationAction, NotificationCategory } from './Notifications.types';
export default function setNotificationCategoryAsync(name: string, actions: NotificationAction[], previewPlaceholder?: string): Promise<NotificationCategory>;
