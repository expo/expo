import UAParser from 'ua-parser-js';
import uuidv4 from 'uuid/v4';
const ExpoPackageJson = require('expo/package.json');
const parser = new UAParser();
const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';
const _sessionId = uuidv4();
export default {
    get name() {
        return 'ExponentConstants';
    },
    get appOwnership() {
        return 'expo';
    },
    get installationId() {
        let installationId;
        try {
            installationId = localStorage.getItem(ID_KEY);
            if (installationId == null || typeof installationId !== 'string') {
                installationId = uuidv4();
                localStorage.setItem(ID_KEY, installationId);
            }
        }
        catch (error) {
            installationId = _sessionId;
        }
        finally {
            return installationId;
        }
    },
    get sessionId() {
        return _sessionId;
    },
    get platform() {
        return { web: UAParser(navigator.userAgent) };
    },
    get isHeadless() {
        return false;
    },
    get isDevice() {
        // TODO: Bacon: Possibly want to add information regarding simulators
        return true;
    },
    get isDetached() {
        return false;
    },
    get expoVersion() {
        return ExpoPackageJson.version;
    },
    get linkingUri() {
        // On native this is `exp://`
        return location.origin + location.pathname;
    },
    get expoRuntimeVersion() {
        return ExpoPackageJson.version;
    },
    get deviceName() {
        const { browser, engine, os: OS } = parser.getResult();
        return browser.name || engine.name || OS.name || undefined;
    },
    get nativeAppVersion() {
        return null;
    },
    get nativeBuildVersion() {
        return null;
    },
    get systemFonts() {
        // TODO: Bacon: Maybe possible.
        return [];
    },
    get statusBarHeight() {
        return 0;
    },
    get deviceYearClass() {
        // TODO: Bacon: The android version isn't very accurate either, maybe we could try and guess this value.
        return null;
    },
    get manifest() {
        return process.env.APP_MANIFEST || {};
    },
    get experienceUrl() {
        return location.origin + location.pathname;
    },
    get debugMode() {
        return __DEV__;
    },
    async getWebViewUserAgentAsync() {
        return navigator.userAgent;
    },
};
//# sourceMappingURL=ExponentConstants.web.js.map