import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import uuidv4 from 'uuid/v4';
const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';
const _sessionId = uuidv4();
function getBrowserName() {
    const agent = navigator.userAgent.toLowerCase();
    switch (true) {
        case agent.includes('edge'):
            return 'Edge';
        case agent.includes('edg'):
            return 'Chromium Edge';
        // @ts-ignore: window is not defined
        case agent.includes('opr') && !!window['opr']:
            return 'Opera';
        // @ts-ignore: window is not defined
        case agent.includes('chrome') && !!window['chrome']:
            return 'Chrome';
        case agent.includes('trident'):
            return 'IE';
        case agent.includes('firefox'):
            return 'Firefox';
        case agent.includes('safari'):
            return 'Safari';
        default:
            return undefined;
    }
}
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
        return { web: canUseDOM ? { ua: navigator.userAgent } : undefined };
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
        return canUseDOM ? getBrowserName() : undefined;
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