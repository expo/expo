import { BackgroundFetchResultValue } from './IOSNotifications';
import Notification from './Notification';
import { Notifications, IOSAttachment, IOSAttachmentOptions, NativeIOSNotification } from './types';
declare type CompletionHandler = (results: BackgroundFetchResultValue) => void;
export default class IOSNotification {
    _alertAction?: string;
    _attachments: IOSAttachment[];
    _badge?: number;
    _category?: string;
    _hasAction?: boolean;
    _launchImage?: string;
    _notification: Notification;
    _threadIdentifier?: string;
    _complete?: CompletionHandler;
    _location?: any;
    _summaryArgumentCount?: number;
    _summaryArgument?: string;
    _volume?: number;
    _isCritical: boolean;
    constructor(notification: Notification, notifications: Notifications, data?: NativeIOSNotification);
    readonly alertAction: string | undefined;
    readonly attachments: IOSAttachment[];
    readonly badge: number | undefined;
    readonly category: string | undefined;
    readonly location: string | undefined;
    readonly hasAction: boolean | undefined;
    readonly launchImage: string | undefined;
    readonly threadIdentifier: string | undefined;
    readonly complete: CompletionHandler | undefined;
    /**
     *
     * @param identifier
     * @param url
     * @param options
     * @returns {Notification}
     */
    addAttachment(identifier: string, url: string, options?: IOSAttachmentOptions): Notification;
    /**
     *
     * @param alertAction
     * @returns {Notification}
     */
    setAlertAction(alertAction: string): Notification;
    /**
     *
     * @param badge
     * @returns {Notification}
     */
    setBadge(badge: number): Notification;
    /**
     *
     * @param category
     * @returns {Notification}
     */
    setCategory(category: string): Notification;
    setLocation(location: any): Notification;
    /**
     *
     * @param hasAction
     * @returns {Notification}
     */
    setHasAction(hasAction: boolean): Notification;
    /**
     *
     * @param launchImage
     * @returns {Notification}
     */
    setLaunchImage(launchImage: string): Notification;
    /**
     *
     * @param threadIdentifier
     * @returns {Notification}
     */
    setThreadIdentifier(threadIdentifier: string): Notification;
    build(): NativeIOSNotification;
}
export {};
