import { NotificationCategory, NotificationAction, NotificationCategoryOptions } from './Notifications.types';
/**
 * Sets the new notification category.
 * @param identifier A string to associate as the ID of this category. You will pass this string in as the `categoryIdentifier`
 * in your [`NotificationContent`](#notificationcontent) to associate a notification with this category.
 * > Don't use the characters `:` or `-` in your category identifier. If you do, categories might not work as expected.
 * @param actions An array of [`NotificationAction`](#notificationaction), which describe the actions associated with this category.
 * @param options An optional object of additional configuration options for your category.
 * @return A Promise which resolves to the category you just have created.
 * @platform android
 * @platform ios
 * @header categories
 */
export default function setNotificationCategoryAsync(identifier: string, actions: NotificationAction[], options?: NotificationCategoryOptions): Promise<NotificationCategory>;
//# sourceMappingURL=setNotificationCategoryAsync.d.ts.map