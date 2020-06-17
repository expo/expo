import { UnavailabilityError } from '@unimodules/core';
import uuidv4 from 'uuid/v4';
import NotificationPresenter from './NotificationPresenterModule';
let warningMessageShown = false;
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