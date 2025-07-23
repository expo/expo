import { ExecutionEnvironment } from './Constants.types';
const _sessionId = (Date.now() + '-' + Math.floor(Math.random() * 1000000000)).toString();
function getBrowserName() {
    if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') {
        const agent = navigator.userAgent.toLowerCase();
        if (agent.includes('edge')) {
            return 'Edge';
        }
        else if (agent.includes('edg')) {
            return 'Chromium Edge';
        }
        else if (agent.includes('opr') && 'opr' in window && !!window['opr']) {
            return 'Opera';
        }
        else if (agent.includes('chrome') && 'chrome' in window && !!window['chrome']) {
            return 'Chrome';
        }
        else if (agent.includes('trident')) {
            return 'IE';
        }
        else if (agent.includes('firefox')) {
            return 'Firefox';
        }
        else if (agent.includes('safari')) {
            return 'Safari';
        }
    }
    return undefined;
}
export default {
    get appOwnership() {
        return null;
    },
    get executionEnvironment() {
        return ExecutionEnvironment.Bare;
    },
    get sessionId() {
        return _sessionId;
    },
    get isHeadless() {
        if (typeof navigator === 'undefined')
            return true;
        return /\bHeadlessChrome\//.test(navigator.userAgent);
    },
    get expoVersion() {
        return this.manifest.sdkVersion || null;
    },
    get linkingUri() {
        if (typeof location !== 'undefined') {
            // On native this is `exp://`
            // On web we should use the protocol and hostname (location.origin)
            return location.origin;
        }
        else {
            return '';
        }
    },
    get expoRuntimeVersion() {
        return this.expoVersion;
    },
    get deviceName() {
        return getBrowserName();
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
        // This is defined by @expo/webpack-config or babel-preset-expo.
        // If your site is bundled with a different config then you may not have access to the app.json automatically.
        return process.env.APP_MANIFEST || {};
    },
    get manifest2() {
        return null;
    },
    get experienceUrl() {
        if (typeof location !== 'undefined') {
            return location.origin;
        }
        else {
            return '';
        }
    },
    get debugMode() {
        return __DEV__;
    },
    async getWebViewUserAgentAsync() {
        if (typeof navigator !== 'undefined') {
            return navigator.userAgent;
        }
        else {
            return null;
        }
    },
};
//# sourceMappingURL=ExponentConstants.web.js.map