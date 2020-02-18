import { UnavailabilityError, Platform } from '@unimodules/core';
import uuidv4 from 'uuid/v4';
import NotificationPresenter from './NotificationPresenter';
export default async function presentNotificationAsync({ identifier, ...notification }) {
    if (!NotificationPresenter.presentNotificationAsync) {
        throw new UnavailabilityError('Notifications', 'presentNotificationAsync');
    }
    // If identifier has not been provided, let's create one.
    const notificationIdentifier = identifier ?? uuidv4();
    // Remember current platform-specific options
    const platformSpecificOptions = notification[Platform.OS] ?? {};
    // Remove all known platform-specific options
    const { ios, android, ...baseRequest } = notification;
    // Merge current platform-specific options
    const easyBodyNotificationSpec = { ...baseRequest, ...platformSpecificOptions };
    // Stringify `body`
    const { body, ...restNotificationSpec } = easyBodyNotificationSpec;
    const notificationSpec = { ...restNotificationSpec, body: JSON.stringify(body) };
    return await NotificationPresenter.presentNotificationAsync(notificationIdentifier, notificationSpec);
}
//# sourceMappingURL=presentNotificationAsync.js.map