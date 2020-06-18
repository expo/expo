import { NotificationAction, NotificationCategory } from './Notifications.types';
export declare function getNotificationCategoriesAsync(): Promise<NotificationCategory[]>;
export declare function setNotificationCategoryAsync(name: string, actions: NotificationAction[], previewPlaceholder?: string): Promise<void>;
export declare function deleteNotificationCategoryAsync(identifier: string): Promise<void>;
