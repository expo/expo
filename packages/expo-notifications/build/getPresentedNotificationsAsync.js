import { UnavailabilityError } from '@unimodules/core';
import NotificationPresenter from './NotificationPresenter';
export default async function getPresentedNotificationsAsync() {
    if (!NotificationPresenter.getPresentedNotificationsAsync) {
        throw new UnavailabilityError('Notifications', 'getPresentedNotificationsAsync');
    }
    return await NotificationPresenter.getPresentedNotificationsAsync();
}
//# sourceMappingURL=getPresentedNotificationsAsync.js.map