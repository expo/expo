import invariant from 'invariant';

import { Platform } from '@unimodules/core';
import { utils } from 'expo-firebase-app';
import AndroidNotification from './AndroidNotification';
import IOSNotification from './IOSNotification';
import { Notifications, NativeNotification } from './types';
const { generatePushID, isObject } = utils;

export type NotificationOpen = {
  action: string;
  notification: Notification;
  results?: { [key: string]: string };
};

export default class Notification {
  // iOS 8/9 | 10+ | Android
  _android: AndroidNotification;

  _body: string = '';

  // alertBody | body | contentText
  _data: { [key: string]: string } = {};

  // userInfo | userInfo | extras
  _ios: IOSNotification;

  _notificationId?: string;

  _sound?: string;

  // soundName | sound | sound
  _subtitle?: string;

  // N/A | subtitle | subText
  _title: string = ''; // alertTitle | title | contentTitle

  constructor(nativeNotification: NativeNotification | undefined, notifications: Notifications) {
    if (nativeNotification) {
      this._body = nativeNotification.body;
      this._data = nativeNotification.data;
      this._notificationId = nativeNotification.notificationId;
      this._sound = nativeNotification.sound;
      this._subtitle = nativeNotification.subtitle;
      this._title = nativeNotification.title;
    }

    this._android = new AndroidNotification(this, nativeNotification && nativeNotification.android);
    this._ios = new IOSNotification(
      this,
      notifications,
      nativeNotification && nativeNotification.ios
    );

    // Defaults
    this._data = this._data || {};
    // TODO: Is this the best way to generate an ID?
    this._notificationId = this._notificationId || generatePushID();
  }

  get android(): AndroidNotification {
    return this._android;
  }

  get body(): string | undefined {
    return this._body;
  }

  get data(): { [key: string]: string } | undefined {
    return this._data;
  }

  get ios(): IOSNotification {
    return this._ios;
  }

  get notificationId(): string | undefined {
    return this._notificationId;
  }

  get sound(): string | undefined {
    return this._sound;
  }

  get subtitle(): string | undefined {
    return this._subtitle;
  }

  get title(): string | undefined {
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
  setData(data: { [key: string]: any } = {}): Notification {
    invariant(
      isObject(data),
      `Notification:withData expects an object but got type '${typeof data}'.`
    );
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
    if (!this._notificationId)
      throw new Error('Notification: Missing required `notificationId` property');

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
