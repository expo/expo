import { Platform } from '@unimodules/core';
const isIOS = Platform.OS === 'ios';
export default class IOSMessaging {
    constructor(messaging) {
        this._messaging = messaging;
    }
    async getAPNSToken() {
        if (!isIOS) {
            return null;
        }
        return await this._messaging.nativeModule.getAPNSToken();
    }
}
//# sourceMappingURL=IOSMessaging.js.map