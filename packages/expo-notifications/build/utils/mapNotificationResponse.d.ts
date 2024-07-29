import { Notification, NotificationResponse } from '../Notifications.types';
/**
 * @hidden
 *
 * Does any required processing of a notification response from native code
 * before it is passed to a notification response listener, or to the
 * last notification response hook.
 *
 * @param response The raw response passed in from native code
 * @returns the mapped response.
 */
export declare const mapNotificationResponse: (response: NotificationResponse) => {
    notification: Notification & {
        request: {
            content: {
                dataString?: string;
            };
        };
    };
    actionIdentifier: string;
    userText?: string | undefined;
};
/**
 * @hidden
 *
 * Does any required processing of a notification from native code
 * before it is passed to a notification listener.
 *
 * @param notification The raw notification passed in from native code
 * @returns the mapped notification.
 */
export declare const mapNotification: (notification: Notification) => Notification & {
    request: {
        content: {
            dataString?: string;
        };
    };
};
//# sourceMappingURL=mapNotificationResponse.d.ts.map