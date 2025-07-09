import { uuid } from 'expo-modules-core';
/**
 * @hidden
 *
 * Schedules a notification for immediate trigger.
 * @param content An object representing the notification content.
 * @param identifier
 * @return It returns a Promise resolving with the notification's identifier once the notification is successfully scheduled for immediate display.
 * @header schedule
 * @deprecated This method has been deprecated in favor of using an explicit `NotificationHandler` and the [`scheduleNotificationAsync`](#schedulenotificationasyncrequest) method.
 * More information can be found in our [FYI document](https://expo.fyi/presenting-notifications-deprecated).
 */
export default async function presentNotificationAsync(content, identifier = uuid.v4()) {
    throw new Error('`presentNotificationAsync` has been removed. Use `scheduleNotificationAsync` + an explicit notification handler. Read more at https://expo.fyi/presenting-notifications-deprecated.');
}
//# sourceMappingURL=presentNotificationAsync.js.map