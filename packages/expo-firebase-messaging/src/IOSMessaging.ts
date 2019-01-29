// @flow

import { Platform } from 'expo-core';
import type Messaging from './';
const isIOS = Platform.OS === 'ios';
export default class IOSMessaging {
  constructor(messaging: Messaging) {
    this._messaging = messaging;
  }
  getAPNSToken(): Promise<string | null> {
    if (!isIOS) {
      return null;
    }
    return this._messaging.nativeModule.getAPNSToken();
  }
}
