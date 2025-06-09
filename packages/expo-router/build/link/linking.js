"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathFromState = exports.getStateFromPath = void 0;
exports.getInitialURL = getInitialURL;
exports.getRootURL = getRootURL;
exports.subscribe = subscribe;
const Linking = __importStar(require("expo-linking"));
const react_native_1 = require("react-native");
const extractPathFromURL_1 = require("../fork/extractPathFromURL");
const getPathFromState_1 = require("../fork/getPathFromState");
Object.defineProperty(exports, "getPathFromState", { enumerable: true, get: function () { return getPathFromState_1.getPathFromState; } });
const getStateFromPath_1 = require("../fork/getStateFromPath");
Object.defineProperty(exports, "getStateFromPath", { enumerable: true, get: function () { return getStateFromPath_1.getStateFromPath; } });
const useLinking_1 = require("../fork/useLinking");
const getRoutesRedirects_1 = require("../getRoutesRedirects");
const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;
// A custom getInitialURL is used on native to ensure the app always starts at
// the root path if it's launched from something other than a deep link.
// This helps keep the native functionality working like the web functionality.
// For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
// then `/index` would be used on web and `/settings` would be used on native.
function getInitialURL() {
    if (typeof window === 'undefined') {
        return '';
    }
    if (react_native_1.Platform.OS === 'web' && window.location?.href) {
        return window.location.href;
    }
    if (react_native_1.Platform.OS === 'ios') {
        // Use the new Expo API for iOS. This has better support for App Clips and handoff.
        const url = Linking.getLinkingURL();
        return (parseExpoGoUrlFromListener(url) ??
            // The path will be nullish in bare apps when the app is launched from the home screen.
            // TODO(EvanBacon): define some policy around notifications.
            getRootURL());
    }
    // TODO: Figure out if expo-linking on Android has full interop with the React Native implementation.
    return Promise.resolve((0, useLinking_1.getInitialURLWithTimeout)()).then((url) => parseExpoGoUrlFromListener(url) ??
        // The path will be nullish in bare apps when the app is launched from the home screen.
        // TODO(EvanBacon): define some policy around notifications.
        getRootURL());
}
let _rootURL;
function getRootURL() {
    if (_rootURL === undefined) {
        _rootURL = Linking.createURL('/');
        if (isExpoGo) {
            _rootURL = (0, extractPathFromURL_1.parsePathFromExpoGoLink)(_rootURL);
        }
    }
    return _rootURL;
}
// Expo Go is weird and requires the root path to be `/--/`
function parseExpoGoUrlFromListener(url) {
    if (!url || !isExpoGo) {
        return url;
    }
    const { pathname, queryString } = (0, extractPathFromURL_1.parsePathAndParamsFromExpoGoLink)(url);
    // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
    // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
    if (!pathname || pathname === '/') {
        return (getRootURL() + queryString);
    }
    return url;
}
function subscribe(nativeLinking, redirects) {
    return (listener) => {
        let callback;
        const legacySubscription = nativeLinking?.legacy_subscribe?.(listener);
        if (isExpoGo) {
            // This extra work is only done in the Expo Go app.
            callback = async ({ url }) => {
                let href = parseExpoGoUrlFromListener(url);
                href = (0, getRoutesRedirects_1.applyRedirects)(href, redirects);
                if (href && nativeLinking?.redirectSystemPath) {
                    href = await nativeLinking.redirectSystemPath({ path: href, initial: false });
                }
                if (href) {
                    listener(href);
                }
            };
        }
        else {
            callback = async ({ url }) => {
                let href = (0, getRoutesRedirects_1.applyRedirects)(url, redirects);
                if (href && nativeLinking?.redirectSystemPath) {
                    href = await nativeLinking.redirectSystemPath({ path: href, initial: false });
                }
                if (href) {
                    listener(href);
                }
            };
        }
        const subscription = Linking.addEventListener('url', callback);
        return () => {
            // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
            subscription?.remove?.();
            legacySubscription?.();
        };
    };
}
//# sourceMappingURL=linking.js.map