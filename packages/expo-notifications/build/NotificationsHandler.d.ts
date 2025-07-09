import { CodedError } from 'expo-modules-core';
import { Notification, NotificationBehavior } from './Notifications.types';
/**
 * @hidden
 */
export declare class NotificationTimeoutError extends CodedError {
    info: {
        notification: Notification;
        id: string;
    };
    constructor(notificationId: string, notification: Notification);
}
export type NotificationHandlingError = NotificationTimeoutError | Error;
export interface NotificationHandler {
    /**
     * A function accepting an incoming notification returning a `Promise` resolving to a behavior ([`NotificationBehavior`](#notificationbehavior))
     * applicable to the notification
     * @param notification An object representing the notification.
     */
    handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
    /**
     * A function called whenever an incoming notification is handled successfully.
     * @param notificationId Identifier of the notification.
     */
    handleSuccess?: (notificationId: string) => void;
    /**
     * A function called whenever calling `handleNotification()` for an incoming notification fails.
     * @param notificationId Identifier of the notification.
     * @param error An error which occurred in form of `NotificationHandlingError` object.
     */
    handleError?: (notificationId: string, error: NotificationHandlingError) => void;
}
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
export declare function setNotificationHandler(handler: NotificationHandler | null): void;
//# sourceMappingURL=NotificationsHandler.d.ts.map