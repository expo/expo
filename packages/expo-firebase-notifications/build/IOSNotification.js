import { Platform } from '@unimodules/core';
const isIOS = Platform.OS === 'ios';
export default class IOSNotification {
    constructor(notification, notifications, data) {
        // alertAction | N/A
        this._attachments = [];
        this._isCritical = false;
        this._notification = notification;
        if (data) {
            this._alertAction = data.alertAction;
            this._attachments = data.attachments;
            this._badge = data.badge;
            this._category = data.category;
            this._location = data.location;
            this._hasAction = data.hasAction;
            this._launchImage = data.launchImage;
            this._threadIdentifier = data.threadIdentifier;
        }
        const complete = (fetchResult) => {
            const { notificationId } = notification;
            if (notificationId) {
                notifications.logger.debug(`Completion handler called for notificationId=${notificationId}`);
            }
            notifications.nativeModule.complete(notificationId, fetchResult);
        };
        if (isIOS && notifications && notifications.ios.shouldAutoComplete) {
            complete(notifications.ios.backgroundFetchResult.noData);
        }
        else {
            this._complete = complete;
        }
        // Defaults
        this._attachments = this._attachments || [];
    }
    get alertAction() {
        return this._alertAction;
    }
    get attachments() {
        return this._attachments;
    }
    get badge() {
        return this._badge;
    }
    get category() {
        return this._category;
    }
    get location() {
        return this._location;
    }
    get hasAction() {
        return this._hasAction;
    }
    get launchImage() {
        return this._launchImage;
    }
    get threadIdentifier() {
        return this._threadIdentifier;
    }
    get complete() {
        return this._complete;
    }
    /**
     *
     * @param identifier
     * @param url
     * @param options
     * @returns {Notification}
     */
    addAttachment(identifier, url, options) {
        this._attachments.push({
            identifier,
            options,
            url,
        });
        return this._notification;
    }
    /**
     *
     * @param alertAction
     * @returns {Notification}
     */
    setAlertAction(alertAction) {
        this._alertAction = alertAction;
        return this._notification;
    }
    /**
     *
     * @param badge
     * @returns {Notification}
     */
    setBadge(badge) {
        this._badge = badge;
        return this._notification;
    }
    /**
     *
     * @param category
     * @returns {Notification}
     */
    setCategory(category) {
        this._category = category;
        return this._notification;
    }
    setLocation(location) {
        this._location = location;
        return this._notification;
    }
    /**
     *
     * @param hasAction
     * @returns {Notification}
     */
    setHasAction(hasAction) {
        this._hasAction = hasAction;
        return this._notification;
    }
    /**
     *
     * @param launchImage
     * @returns {Notification}
     */
    setLaunchImage(launchImage) {
        this._launchImage = launchImage;
        return this._notification;
    }
    /**
     *
     * @param threadIdentifier
     * @returns {Notification}
     */
    setThreadIdentifier(threadIdentifier) {
        this._threadIdentifier = threadIdentifier;
        return this._notification;
    }
    build() {
        // TODO: Validation of required fields
        return {
            summaryArgumentCount: this._summaryArgumentCount,
            summaryArgument: this._summaryArgument,
            volume: this._volume,
            isCritical: this._isCritical,
            alertAction: this._alertAction,
            attachments: this._attachments,
            badge: this._badge,
            category: this._category,
            location: this._location,
            hasAction: this._hasAction,
            launchImage: this._launchImage,
            threadIdentifier: this._threadIdentifier,
        };
    }
}
//# sourceMappingURL=IOSNotification.js.map