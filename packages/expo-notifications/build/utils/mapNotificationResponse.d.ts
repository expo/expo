import { Notification, NotificationContent, NotificationRequest, NotificationResponse } from '../Notifications.types';
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
    notification: {
        request: {
            content: ({
                title: string | null;
                subtitle: string | null;
                body: string | null;
                data: {
                    [key: string]: unknown;
                };
                categoryIdentifier: string | null;
                sound: "default" | "defaultCritical" | "custom" | null;
            } & import("..").NotificationContentIos) | ({
                title: string | null;
                subtitle: string | null;
                body: string | null;
                data: {
                    [key: string]: unknown;
                };
                categoryIdentifier: string | null;
                sound: "default" | "defaultCritical" | "custom" | null;
            } & import("..").NotificationContentAndroid);
            identifier: string;
            trigger: import("..").NotificationTrigger;
        };
        date: number;
    };
    actionIdentifier: string;
    userText?: string;
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
export declare const mapNotification: (notification: Notification) => {
    request: {
        content: ({
            title: string | null;
            subtitle: string | null;
            body: string | null;
            data: {
                [key: string]: unknown;
            };
            categoryIdentifier: string | null;
            sound: "default" | "defaultCritical" | "custom" | null;
        } & import("..").NotificationContentIos) | ({
            title: string | null;
            subtitle: string | null;
            body: string | null;
            data: {
                [key: string]: unknown;
            };
            categoryIdentifier: string | null;
            sound: "default" | "defaultCritical" | "custom" | null;
        } & import("..").NotificationContentAndroid);
        identifier: string;
        trigger: import("..").NotificationTrigger;
    };
    date: number;
};
/**
 * @hidden
 *
 * Does any required processing of a notification request from native code
 * before it is passed to other JS code.
 *
 * @param request The raw request passed in from native code
 * @returns the mapped request.
 */
export declare const mapNotificationRequest: (request: NotificationRequest) => {
    content: ({
        title: string | null;
        subtitle: string | null;
        body: string | null;
        data: {
            [key: string]: unknown;
        };
        categoryIdentifier: string | null;
        sound: "default" | "defaultCritical" | "custom" | null;
    } & import("..").NotificationContentIos) | ({
        title: string | null;
        subtitle: string | null;
        body: string | null;
        data: {
            [key: string]: unknown;
        };
        categoryIdentifier: string | null;
        sound: "default" | "defaultCritical" | "custom" | null;
    } & import("..").NotificationContentAndroid);
    identifier: string;
    trigger: import("..").NotificationTrigger;
};
/**
 * @hidden
 * Does any required processing of notification content from native code
 * before being passed to other JS code.
 *
 * @param content The raw content passed in from native code
 * @returns the mapped content.
 */
export declare const mapNotificationContent: (content: NotificationContent) => ({
    title: string | null;
    subtitle: string | null;
    body: string | null;
    data: {
        [key: string]: unknown;
    };
    categoryIdentifier: string | null;
    sound: "default" | "defaultCritical" | "custom" | null;
} & import("..").NotificationContentIos) | ({
    title: string | null;
    subtitle: string | null;
    body: string | null;
    data: {
        [key: string]: unknown;
    };
    categoryIdentifier: string | null;
    sound: "default" | "defaultCritical" | "custom" | null;
} & import("..").NotificationContentAndroid);
//# sourceMappingURL=mapNotificationResponse.d.ts.map