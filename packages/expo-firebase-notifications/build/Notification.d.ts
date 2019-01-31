import AndroidNotification from './AndroidNotification';
import IOSNotification from './IOSNotification';
import { Notifications, NativeNotification } from './types';
export declare type NotificationOpen = {
    action: string;
    notification: Notification;
    results?: {
        [key: string]: string;
    };
};
export default class Notification {
    _android: AndroidNotification;
    _body: string;
    _data: {
        [key: string]: string;
    };
    _ios: IOSNotification;
    _notificationId?: string;
    _sound?: string;
    _subtitle?: string;
    _title: string;
    constructor(nativeNotification: NativeNotification | undefined, notifications: Notifications);
    readonly android: AndroidNotification;
    readonly body: string | undefined;
    readonly data: {
        [key: string]: string;
    } | undefined;
    readonly ios: IOSNotification;
    readonly notificationId: string | undefined;
    readonly sound: string | undefined;
    readonly subtitle: string | undefined;
    readonly title: string | undefined;
    /**
     *
     * @param body
     * @returns {Notification}
     */
    setBody(body: string): Notification;
    /**
     *
     * @param data
     * @returns {Notification}
     */
    setData(data?: {
        [key: string]: any;
    }): Notification;
    /**
     *
     * @param notificationId
     * @returns {Notification}
     */
    setNotificationId(notificationId: string): Notification;
    /**
     *
     * @param sound
     * @returns {Notification}
     */
    setSound(sound: string): Notification;
    /**
     *
     * @param subtitle
     * @returns {Notification}
     */
    setSubtitle(subtitle: string): Notification;
    /**
     *
     * @param title
     * @returns {Notification}
     */
    setTitle(title: string): Notification;
    build(): NativeNotification;
}
