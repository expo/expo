import UAParser from 'ua-parser-js';
import uuidv4 from 'uuid/v4';
import { CodedError } from '@unimodules/core';
function getExpoPackage() {
    try {
        return require('expo/package.json');
    }
    catch (error) {
        throw new CodedError('ERR_CONSTANTS', 'expoVersion & expoRuntimeVersion require the expo package to be installed.');
    }
}
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
    get isDetached() {
        return false;
    },
    get expoVersion() {
        return getExpoPackage().version;
    },
    get linkingUri() {
        // On native this is `exp://`
        return location.origin + location.pathname;
    },
    get expoRuntimeVersion() {
        return getExpoPackage().version;
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
    get manifest() {
        // This is defined by @expo/webpack-config. 
        // If your site is bundled with a different config then you may not have access to the app.json automatically.
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