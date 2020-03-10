import { EventEmitter, CodedError, Platform } from '@unimodules/core';
import NotificationsHandlerModule from './NotificationsHandlerModule';
export class NotificationTimeoutError extends CodedError {
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
            try {
                const { ios, android, ...baseBehavior } = await handler.handleNotification(notification);
                const platformSpecificBehaviors = { ios, android };
                const nativeBehavior = {
                    ...baseBehavior,
                    ...platformSpecificBehaviors[Platform.OS],
                };
                await NotificationsHandlerModule.handleNotificationAsync(id, nativeBehavior);
                // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
                // eslint-disable-next-line
                handler.handleSuccess?.(id);
            }
            catch (error) {
                // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
                // eslint-disable-next-line
                handler.handleError?.(id, error);
            }
        });
        handleTimeoutSubscription = notificationEmitter.addListener(handleNotificationTimeoutEventName, ({ id, notification }) => handler.handleError?.(id, new NotificationTimeoutError(id, notification)));
    }
}
//# sourceMappingURL=NotificationsHandler.js.map