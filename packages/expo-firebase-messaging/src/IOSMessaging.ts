import { Platform } from '@unimodules/core';

const isIOS = Platform.OS === 'ios';

export default class IOSMessaging {
  _messaging: any;
  constructor(messaging: any) {
    this._messaging = messaging;
  }

  async getAPNSToken(): Promise<string | null> {
    if (!isIOS) {
      return null;
    }
    return await this._messaging.nativeModule.getAPNSToken();
  }
}
