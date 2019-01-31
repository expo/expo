import { App, ModuleBase } from 'expo-firebase-app';
import AndroidAction from './AndroidAction';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import AndroidNotifications from './AndroidNotifications';
import AndroidRemoteInput from './AndroidRemoteInput';
import IOSNotifications from './IOSNotifications';
import Notification, { NotificationOpen } from './Notification';
import { BadgeIconType, Category, Defaults, GroupAlert, Importance, Priority, Schedule, SemanticAction, Visibility } from './types';
declare type OnNotification = (notification: Notification) => any;
declare type OnNotificationObserver = {
    next: OnNotification;
};
declare type OnNotificationOpened = (notification: NotificationOpen) => any;
declare type OnNotificationOpenedObserver = {
    next: NotificationOpen;
};
export declare const MODULE_NAME = "ExpoFirebaseNotifications";
export declare const NAMESPACE = "notifications";
export declare const statics: {
    Android: {
        Action: typeof AndroidAction;
        BadgeIconType: typeof BadgeIconType;
        Category: typeof Category;
        Channel: typeof AndroidChannel;
        ChannelGroup: typeof AndroidChannelGroup;
        Defaults: typeof Defaults;
        GroupAlert: typeof GroupAlert;
        Importance: typeof Importance;
        Priority: typeof Priority;
        RemoteInput: typeof AndroidRemoteInput;
        SemanticAction: typeof SemanticAction;
        Visibility: typeof Visibility;
    };
    Notification: typeof Notification;
};
/**
 * @class Notifications
 */
export default class Notifications extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        Android: {
            Action: typeof AndroidAction;
            BadgeIconType: typeof BadgeIconType;
            Category: typeof Category;
            Channel: typeof AndroidChannel;
            ChannelGroup: typeof AndroidChannelGroup;
            Defaults: typeof Defaults;
            GroupAlert: typeof GroupAlert;
            Importance: typeof Importance;
            Priority: typeof Priority;
            RemoteInput: typeof AndroidRemoteInput;
            SemanticAction: typeof SemanticAction;
            Visibility: typeof Visibility;
        };
        Notification: typeof Notification;
    };
    _android: AndroidNotifications;
    _ios: IOSNotifications;
    constructor(app: App);
    readonly android: AndroidNotifications;
    readonly ios: IOSNotifications;
    /**
     * Cancel all notifications
     */
    cancelAllNotifications(): Promise<void>;
    /**
     * Cancel a notification by id.
     * @param notificationId
     */
    cancelNotification(notificationId: string): Promise<void>;
    /**
     * Display a notification
     * @param notification
     * @returns {*}
     */
    displayNotification(notification: Notification): Promise<void>;
    getBadge(): Promise<number>;
    getInitialNotification(): Promise<NotificationOpen>;
    /**
     * Returns an array of all scheduled notifications
     * @returns {Promise.<Array>}
     */
    getScheduledNotifications(): Promise<Notification[]>;
    onNotification(nextOrObserver: OnNotification | OnNotificationObserver | any): () => any;
    onNotificationDisplayed(nextOrObserver: OnNotification | OnNotificationObserver | any): () => any;
    onNotificationOpened(nextOrObserver: OnNotificationOpened | OnNotificationOpenedObserver | any): () => any;
    /**
     * Remove all delivered notifications.
     */
    removeAllDeliveredNotifications(): Promise<void>;
    /**
     * Remove a delivered notification.
     * @param notificationId
     */
    removeDeliveredNotification(notificationId: string): Promise<void>;
    /**
     * Schedule a notification
     * @param notification
     * @returns {*}
     */
    scheduleNotification(notification: Notification, schedule: Schedule): Promise<void>;
    setBadge(badge: number): Promise<void>;
}
export { AndroidAction, AndroidChannel, AndroidChannelGroup, AndroidNotifications, AndroidRemoteInput, Notification, NotificationOpen, };
