import { Platform } from 'expo-modules-core';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionEnvironment, } from './Constants.types';
const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';
const _sessionId = uuidv4();
function getBrowserName() {
    if (Platform.isDOMAvailable) {
        const agent = navigator.userAgent.toLowerCase();
        if (agent.includes('edge')) {
            return 'Edge';
        }
        else if (agent.includes('edg')) {
            return 'Chromium Edge';
        }
        else if (agent.includes('opr') && !!window['opr']) {
            return 'Opera';
        }
        else if (agent.includes('chrome') && !!window['chrome']) {
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
    get name() {
        return 'ExponentConstants';
    },
    get appOwnership() {
        return null;
    },
    get executionEnvironment() {
        return ExecutionEnvironment.Bare;
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
        catch {
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
        return { web: Platform.isDOMAvailable ? { ua: navigator.userAgent } : undefined };
    },
    get isHeadless() {
        if (!Platform.isDOMAvailable)
            return true;
        return /\bHeadlessChrome\//.test(navigator.userAgent);
    },
    get isDevice() {
        // TODO: Bacon: Possibly want to add information regarding simulators
        return true;
    },
    get expoVersion() {
        return this.manifest.sdkVersion || null;
    },
    get linkingUri() {
        if (Platform.isDOMAvailable) {
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
    get manifest2() {
        return null;
    },
    get experienceUrl() {
        if (Platform.isDOMAvailable) {
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
        if (Platform.isDOMAvailable) {
            return navigator.userAgent;
        }
        else {
            return null;
        }
    },
};
//# sourceMappingURL=ExponentConstants.web.js.map