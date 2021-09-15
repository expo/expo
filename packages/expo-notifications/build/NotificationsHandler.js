import { EventEmitter, CodedError, UnavailabilityError } from 'expo-modules-core';
import NotificationsHandlerModule from './NotificationsHandlerModule';
export class NotificationTimeoutError extends CodedError {
    info;
    constructor(notificationId, notification) {
        super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
        this.info = { id: notificationId, notification };
    }
}
// Web uses SyntheticEventEmitter
const notificationEmitter = new EventEmitter(NotificationsHandlerModule);
const handleNotificationEventName = 'onHandleNotification';
const handleNotificationTimeoutEventName = 'onHandleNotificationTimeout';
let handleSubscription = null;
let handleTimeoutSubscription = null;
export function setNotificationHandler(handler) {
    if (handleSubscription) {
        handleSubscription.remove();
        handleSubscription = null;
    }
    if (handleTimeoutSubscription) {
        handleTimeoutSubscription.remove();
        handleTimeoutSubscription = null;
    }
    if (handler) {
        handleSubscription = notificationEmitter.addListener(handleNotificationEventName, async ({ id, notification }) => {
            if (!NotificationsHandlerModule.handleNotificationAsync) {
                handler.handleError?.(id, new UnavailabilityError('Notifications', 'handleNotificationAsync'));
                return;
            }
            try {
                const behavior = await handler.handleNotification(notification);
                await NotificationsHandlerModule.handleNotificationAsync(id, behavior);
                handler.handleSuccess?.(id);
            }
            catch (error) {
                handler.handleError?.(id, error);
            }
        });
        handleTimeoutSubscription = notificationEmitter.addListener(handleNotificationTimeoutEventName, ({ id, notification }) => handler.handleError?.(id, new NotificationTimeoutError(id, notification)));
    }
}
//# sourceMappingURL=NotificationsHandler.js.map