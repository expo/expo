import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import UAParser from 'ua-parser-js';
import uuidv4 from 'uuid/v4';
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
        return { web: canUseDOM ? UAParser(navigator.userAgent) : undefined };
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
        return this.manifest.sdkVersion || null;
    },
    get linkingUri() {
        if (canUseDOM) {
            // On native this is `exp://`
            return location.origin + location.pathname;
        }
        else {
            return '';
        }
    },
    get expoRuntimeVersion() {
        return this.expoVersion;
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
        // This is defined by @expo/webpack-config.
        // If your site is bundled with a different config then you may not have access to the app.json automatically.
        return process.env.APP_MANIFEST || {};
    },
    get experienceUrl() {
        if (canUseDOM) {
            return location.origin + location.pathname;
        }
        else {
            return '';
        }
    },
    get debugMode() {
        return __DEV__;
    },
    async getWebViewUserAgentAsync() {
        if (canUseDOM) {
            return navigator.userAgent;
        }
        else {
            return null;
        }
    },
};
//# sourceMappingURL=ExponentConstants.web.js.map