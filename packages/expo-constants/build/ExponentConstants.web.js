import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
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
        let installationId = localStorage.getItem(ID_KEY);
        if (!installationId) {
            installationId = uuidv4();
            localStorage.setItem(ID_KEY, installationId);
        }
        return installationId;
    },
    get sessionId() {
        return _sessionId;
    },
    get platform() {
        return { web: UAParser(navigator.userAgent) };
    },
    get isDevice() {
        // TODO: Bacon: Possibly want to add information regarding simulators
        return true;
    },
    get expoVersion() {
        return ExpoPackageJson.version;
    },
    get linkingUri() {
        return location.origin + location.pathname;
    },
    get expoRuntimeVersion() {
        return null;
    },
    get deviceName() {
        const { browser, engine, os: OS } = parser.getResult();
        return browser.name || engine.name || OS.name || null;
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
        console.log(`ExponentConstants.deviceYearClass: is unimplemented on web.`);
        return null;
    },
    get manifest() {
        return process.env.APP_MANIFEST || {};
    },
    async getWebViewUserAgentAsync() {
        return navigator.userAgent;
    },
};
//# sourceMappingURL=ExponentConstants.web.js.map