/**
 * @flow
 * Invitation representation wrapper
 */
import { Platform } from 'expo-core';
import AndroidInvitation from './AndroidInvitation';

import type { NativeInvitation } from './types';

export default class Invitation {
  _android: AndroidInvitation;

  _androidClientId: string | void;

  _androidMinimumVersionCode: number | void;

  _callToActionText: string | void;

  _customImage: string | void;

  _deepLink: string | void;

  _iosClientId: string | void;

  _message: string;

  _title: string;

  constructor(title: string, message: string) {
    this._android = new AndroidInvitation(this);
    this._message = message;
    this._title = title;
  }

  get android(): AndroidInvitation {
    return this._android;
  }

  /**
   *
   * @param androidClientId
   * @returns {Invitation}
   */
  setAndroidClientId(androidClientId: string): Invitation {
    this._androidClientId = androidClientId;
    return this;
  }

  /**
   *
   * @param androidMinimumVersionCode
   * @returns {Invitation}
   */
  setAndroidMinimumVersionCode(androidMinimumVersionCode: number): Invitation {
    this._androidMinimumVersionCode = androidMinimumVersionCode;
    return this;
  }

  /**
   *
   * @param callToActionText
   * @returns {Invitation}
   */
  setCallToActionText(callToActionText: string): Invitation {
    this._callToActionText = callToActionText;
    return this;
  }

  /**
   *
   * @param customImage
   * @returns {Invitation}
   */
  setCustomImage(customImage: string): Invitation {
    this._customImage = customImage;
    return this;
  }

  /**
   *
   * @param deepLink
   * @returns {Invitation}
   */
  setDeepLink(deepLink: string): Invitation {
    this._deepLink = deepLink;
    return this;
  }

  /**
   *
   * @param iosClientId
   * @returns {Invitation}
   */
  setIOSClientId(iosClientId: string): Invitation {
    this._iosClientId = iosClientId;
    return this;
  }

  build(): NativeInvitation {
    if (!this._message) {
      throw new Error('Invitation: Missing required `message` property');
    } else if (!this._title) {
      throw new Error('Invitation: Missing required `title` property');
    }

    return {
      android: Platform.OS === 'android' ? this._android.build() : undefined,
      androidClientId: this._androidClientId,
      androidMinimumVersionCode: this._androidMinimumVersionCode,
      callToActionText: this._callToActionText,
      customImage: this._customImage,
      deepLink: this._deepLink,
      iosClientId: this._iosClientId,
      message: this._message,
      title: this._title,
    };
  }
}
