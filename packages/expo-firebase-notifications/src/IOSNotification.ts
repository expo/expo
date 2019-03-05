import { Platform } from '@unimodules/core';
import { BackgroundFetchResultValue } from './IOSNotifications';

import Notification from './Notification';
import { Notifications, IOSAttachment, IOSAttachmentOptions, NativeIOSNotification } from './types';

type CompletionHandler = (results: BackgroundFetchResultValue) => void;

const isIOS = Platform.OS === 'ios';
export default class IOSNotification {
  _alertAction?: string;

  // alertAction | N/A
  _attachments: IOSAttachment[] = [];

  // N/A | attachments
  _badge?: number;

  // applicationIconBadgeNumber | badge
  _category?: string;

  _hasAction?: boolean;

  // hasAction | N/A
  _launchImage?: string;

  // alertLaunchImage | launchImageName
  _notification: Notification;

  _threadIdentifier?: string; // N/A | threadIdentifier

  _complete?: CompletionHandler;

  _location?: any;

  _summaryArgumentCount?: number;
  _summaryArgument?: string;
  _volume?: number;
  _isCritical: boolean = false;

  constructor(
    notification: Notification,
    notifications: Notifications,
    data?: NativeIOSNotification
  ) {
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

    const complete = (fetchResult: BackgroundFetchResultValue) => {
      const { notificationId } = notification;
      if (notificationId) {
        notifications.logger.debug(
          `Completion handler called for notificationId=${notificationId}`
        );
      }
      notifications.nativeModule.complete(notificationId, fetchResult);
    };

    if (isIOS && notifications && notifications.ios.shouldAutoComplete) {
      complete(notifications.ios.backgroundFetchResult.noData);
    } else {
      this._complete = complete;
    }

    // Defaults
    this._attachments = this._attachments || [];
  }

  get alertAction(): string | undefined {
    return this._alertAction;
  }

  get attachments(): IOSAttachment[] {
    return this._attachments;
  }

  get badge(): number | undefined {
    return this._badge;
  }

  get category(): string | undefined {
    return this._category;
  }

  get location(): string | undefined {
    return this._location;
  }

  get hasAction(): boolean | undefined {
    return this._hasAction;
  }

  get launchImage(): string | undefined {
    return this._launchImage;
  }

  get threadIdentifier(): string | undefined {
    return this._threadIdentifier;
  }

  get complete(): CompletionHandler | undefined {
    return this._complete;
  }

  /**
   *
   * @param identifier
   * @param url
   * @param options
   * @returns {Notification}
   */
  addAttachment(identifier: string, url: string, options?: IOSAttachmentOptions): Notification {
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
  setAlertAction(alertAction: string): Notification {
    this._alertAction = alertAction;
    return this._notification;
  }

  /**
   *
   * @param badge
   * @returns {Notification}
   */
  setBadge(badge: number): Notification {
    this._badge = badge;
    return this._notification;
  }

  /**
   *
   * @param category
   * @returns {Notification}
   */
  setCategory(category: string): Notification {
    this._category = category;
    return this._notification;
  }

  setLocation(location): Notification {
    this._location = location;
    return this._notification;
  }

  /**
   *
   * @param hasAction
   * @returns {Notification}
   */
  setHasAction(hasAction: boolean): Notification {
    this._hasAction = hasAction;
    return this._notification;
  }

  /**
   *
   * @param launchImage
   * @returns {Notification}
   */
  setLaunchImage(launchImage: string): Notification {
    this._launchImage = launchImage;
    return this._notification;
  }

  /**
   *
   * @param threadIdentifier
   * @returns {Notification}
   */
  setThreadIdentifier(threadIdentifier: string): Notification {
    this._threadIdentifier = threadIdentifier;
    return this._notification;
  }

  build(): NativeIOSNotification {
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
