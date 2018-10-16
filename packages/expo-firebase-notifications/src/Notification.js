/**
 * @flow
 * Notification representation wrapper
 */
import { Platform } from 'expo-core';
import AndroidNotification from './AndroidNotification';
import IOSNotification from './IOSNotification';
import { utils } from 'expo-firebase-app';
const { generatePushID, isObject } = utils;

import type { NativeNotification } from './types';

export type NotificationOpen = {|
  action: string,
  notification: Notification,
  results?: { [string]: string },
|};

export default class Notification {
  // iOS 8/9 | 10+ | Android
  _android: AndroidNotification;

  _body: string;

  // alertBody | body | contentText
  _data: { [string]: string };

  // userInfo | userInfo | extras
  _ios: IOSNotification;

  _notificationId: string;

  _sound: string | void;

  // soundName | sound | sound
  _subtitle: string | void;

  // N/A | subtitle | subText
  _title: string; // alertTitle | title | contentTitle

  constructor(data?: NativeNotification) {
    this._android = new AndroidNotification(this, data && data.android);
    this._ios = new IOSNotification(this, data && data.ios);

    if (data) {
      this._body = data.body;
      this._data = data.data;
      this._notificationId = data.notificationId;
      this._sound = data.sound;
      this._subtitle = data.subtitle;
      this._title = data.title;
    }

    // Defaults
    this._data = this._data || {};
    // TODO: Is this the best way to generate an ID?
    this._notificationId = this._notificationId || generatePushID();
  }

  get android(): AndroidNotification {
    return this._android;
  }

  get body(): string {
    return this._body;
  }

  get data(): { [string]: string } {
    return this._data;
  }

  get ios(): IOSNotification {
    return this._ios;
  }

  get notificationId(): string {
    return this._notificationId;
  }

  get sound(): ?string {
    return this._sound;
  }

  get subtitle(): ?string {
    return this._subtitle;
  }

  get title(): string {
    return this._title;
  }

  /**
   *
   * @param body
   * @returns {Notification}
   */
  setBody(body: string): Notification {
    this._body = body;
    return this;
  }

  /**
   *
   * @param data
   * @returns {Notification}
   */
  setData(data: Object = {}): Notification {
    if (!isObject(data)) {
      throw new Error(`Notification:withData expects an object but got type '${typeof data}'.`);
    }
    this._data = data;
    return this;
  }

  /**
   *
   * @param notificationId
   * @returns {Notification}
   */
  setNotificationId(notificationId: string): Notification {
    this._notificationId = notificationId;
    return this;
  }

  /**
   *
   * @param sound
   * @returns {Notification}
   */
  setSound(sound: string): Notification {
    this._sound = sound;
    return this;
  }

  /**
   *
   * @param subtitle
   * @returns {Notification}
   */
  setSubtitle(subtitle: string): Notification {
    this._subtitle = subtitle;
    return this;
  }

  /**
   *
   * @param title
   * @returns {Notification}
   */
  setTitle(title: string): Notification {
    this._title = title;
    return this;
  }

  build(): NativeNotification {
    if (!this._notificationId) {
      throw new Error('Notification: Missing required `notificationId` property');
    }

    return {
      android: Platform.OS === 'android' ? this._android.build() : undefined,
      body: this._body,
      data: this._data,
      ios: Platform.OS === 'ios' ? this._ios.build() : undefined,
      notificationId: this._notificationId,
      sound: this._sound,
      subtitle: this._subtitle,
      title: this._title,
    };
  }
}
