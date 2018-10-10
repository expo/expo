/**
 * @flow
 * IOSNotification representation wrapper
 */
import type Notification from './Notification';
import type {
  IOSAttachment,
  IOSAttachmentOptions,
  NativeIOSNotification,
} from './types';

export default class IOSNotification {
  _alertAction: string | void;

  // alertAction | N/A
  _attachments: IOSAttachment[];

  // N/A | attachments
  _badge: number | void;

  // applicationIconBadgeNumber | badge
  _category: string | void;

  _hasAction: boolean | void;

  // hasAction | N/A
  _launchImage: string | void;

  // alertLaunchImage | launchImageName
  _notification: Notification;

  _threadIdentifier: string | void; // N/A | threadIdentifier

  constructor(notification: Notification, data?: NativeIOSNotification) {
    this._notification = notification;

    if (data) {
      this._alertAction = data.alertAction;
      this._attachments = data.attachments;
      this._badge = data.badge;
      this._category = data.category;
      this._hasAction = data.hasAction;
      this._launchImage = data.launchImage;
      this._threadIdentifier = data.threadIdentifier;
    }

    // Defaults
    this._attachments = this._attachments || [];
  }

  get alertAction(): ?string {
    return this._alertAction;
  }

  get attachments(): IOSAttachment[] {
    return this._attachments;
  }

  get badge(): ?number {
    return this._badge;
  }

  get category(): ?string {
    return this._category;
  }

  get hasAction(): ?boolean {
    return this._hasAction;
  }

  get launchImage(): ?string {
    return this._launchImage;
  }

  get threadIdentifier(): ?string {
    return this._threadIdentifier;
  }

  /**
   *
   * @param identifier
   * @param url
   * @param options
   * @returns {Notification}
   */
  addAttachment(
    identifier: string,
    url: string,
    options?: IOSAttachmentOptions
  ): Notification {
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
      alertAction: this._alertAction,
      attachments: this._attachments,
      badge: this._badge,
      category: this._category,
      hasAction: this._hasAction,
      launchImage: this._launchImage,
      threadIdentifier: this._threadIdentifier,
    };
  }
}
