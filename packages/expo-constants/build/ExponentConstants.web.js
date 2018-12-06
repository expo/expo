import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
const ExpoPackageJson = require('expo/package.json');
export default {
    _sessionId: uuidv4(),
    get appOwnership() {
        return 'expo';
    },
    get deviceId() {
        console.warn(`ExponentConstants.deviceId: is unimplemented on this platform.`);
        return null;
    },
    get name() {
        return 'ExponentConstants';
    },
    get sessionId() {
        return this._sessionId;
    },
    get platform() {
        return { web: UAParser(navigator.userAgent) };
    },
    get isDevice() {
        return true;
    },
    get expoVersion() {
        return ExpoPackageJson.version;
    },
    get linkingUri() {
        return location.origin + location.pathname;
    },
    get expoRuntimeVersion() {
        console.warn(`ExponentConstants.expoRuntimeVersion: is unimplemented on this platform.`);
        return null;
    },
    get deviceName() {
        return null;
    },
    get systemFonts() {
        return [];
    },
    get statusBarHeight() {
        return 0;
    },
    get deviceYearClass() {
        console.warn(`ExponentConstants.deviceYearClass: is unimplemented on this platform.`);
        return null;
    },
    get manifest() {
        /* TODO: Bacon: Populate */
        return {};
    },
    async getWebViewUserAgentAsync() {
        return navigator.userAgent;
    }
};
//# sourceMappingURL=ExponentConstants.web.js.map