import { NotificationContentInput } from './Notifications.types';
/**
 * Schedules a notification for immediate trigger.
 * @param content An object representing the notification content.
 * @param identifier
 * @return It returns a Promise resolving with the notification's identifier once the notification is successfully scheduled for immediate display.
 * @header schedule
 * @deprecated This method has been deprecated in favor of using an explicit `NotificationHandler` and the [`scheduleNotificationAsync`](#notificationsschedulenotificationasyncrequest) method. More information can be found in our [FYI document](https://expo.fyi/presenting-notifications-deprecated).
 */
export default function presentNotificationAsync(content: NotificationContentInput, identifier?: string): Promise<string>;
//# sourceMappingURL=presentNotificationAsync.d.ts.map