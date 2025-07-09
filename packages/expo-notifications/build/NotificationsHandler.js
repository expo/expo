import { LegacyEventEmitter, CodedError, UnavailabilityError, } from 'expo-modules-core';
import NotificationsHandlerModule from './NotificationsHandlerModule';
import { mapNotification } from './utils/mapNotificationResponse';
/**
 * @hidden
 */
export class NotificationTimeoutError extends CodedError {
    info;
    constructor(notificationId, notification) {
        super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
        this.info = { id: notificationId, notification };
    }
}
// Web uses SyntheticEventEmitter
const notificationEmitter = new LegacyEventEmitter(NotificationsHandlerModule);
const handleNotificationEventName = 'onHandleNotification';
const handleNotificationTimeoutEventName = 'onHandleNotificationTimeout';
let handleSubscription = null;
let handleTimeoutSubscription = null;
/**
 * When a notification is received while the app is running, using this function you can set a callback that will decide
 * whether the notification should be shown to the user or not.
 *
 * When a notification is received, `handleNotification` is called with the incoming notification as an argument.
 * The function should respond with a behavior object within 3 seconds, otherwise, the notification will be discarded.
 * If the notification is handled successfully, `handleSuccess` is called with the identifier of the notification,
 * otherwise (or on timeout) `handleError` will be called.
 *
 * The default behavior when the handler is not set or does not respond in time is not to show the notification.
 * @param handler A single parameter which should be either `null` (if you want to clear the handler) or a [`NotificationHandler`](#notificationhandler) object.
 *
 * @example Implementing a notification handler that always shows the notification when it is received.
 * ```jsx
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.setNotificationHandler({
 *   handleNotification: async () => ({
 *     shouldShowBanner: true,
 *     shouldShowList: true,
 *     shouldPlaySound: false,
 *     shouldSetBadge: false,
 *   }),
 * });
 * ```
 * @header inForeground
 */
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
                const mappedNotification = mapNotification(notification);
                const behavior = await handler.handleNotification(mappedNotification);
                if (behavior.shouldShowAlert) {
                    console.warn('[expo-notifications]: `shouldShowAlert` is deprecated. Specify `shouldShowBanner` and / or `shouldShowList` instead.');
                }
                await NotificationsHandlerModule.handleNotificationAsync(id, behavior);
                handler.handleSuccess?.(id);
            }
            catch (error) {
                // TODO(@kitten): This callback expects specific Error types, but we never narrow the type before calling this callback
                handler.handleError?.(id, error);
            }
        });
        handleTimeoutSubscription = notificationEmitter.addListener(handleNotificationTimeoutEventName, ({ id, notification }) => handler.handleError?.(id, new NotificationTimeoutError(id, mapNotification(notification))));
    }
}
//# sourceMappingURL=NotificationsHandler.js.map