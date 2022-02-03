import { UnavailabilityError } from 'expo-modules-core';
import NotificationPresenter from './NotificationPresenterModule';
export default async function getPresentedNotificationsAsync() {
    if (!NotificationPresenter.getPresentedNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'getPresentedNotificationsAsync');
    }
    return await NotificationPresenter.getPresentedNotificationsAsync();
}
//# sourceMappingURL=getPresentedNotificationsAsync.js.map