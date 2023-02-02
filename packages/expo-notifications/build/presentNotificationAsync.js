import { UnavailabilityError } from 'expo-modules-core';
import { v4 as uuidv4 } from 'uuid';
import NotificationPresenter from './NotificationPresenterModule';
let warningMessageShown = false;
/**
 * Schedules a notification for immediate trigger.
 * @param content An object representing the notification content.
 * @param identifier
 * @return It returns a Promise resolving with the notification's identifier once the notification is successfully scheduled for immediate display.
 * @header schedule
 * @deprecated This method has been deprecated in favor of using an explicit `NotificationHandler` and the [`scheduleNotificationAsync`](#notificationsschedulenotificationasyncrequest) method. More information can be found in our [FYI document](https://expo.fyi/presenting-notifications-deprecated).
 */
export default async function presentNotificationAsync(content, identifier = uuidv4()) {
    if (__DEV__ && !warningMessageShown) {
        console.warn('`presentNotificationAsync` has been deprecated in favor of using `scheduleNotificationAsync` + an explicit notification handler. Read more at https://expo.fyi/presenting-notifications-deprecated.');
        warningMessageShown = true;
    }
    if (!NotificationPresenter.presentNotificationAsync) {
        throw new UnavailabilityError('Notifications', 'presentNotificationAsync');
    }
    return await NotificationPresenter.presentNotificationAsync(identifier, content);
}
//# sourceMappingURL=presentNotificationAsync.js.map