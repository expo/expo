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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathFromState = exports.getStateFromPath = exports.addEventListener = exports.getRootURL = exports.getInitialURL = void 0;
const expo_constants_1 = __importStar(require("expo-constants"));
const Linking = __importStar(require("expo-linking"));
const react_native_1 = require("react-native");
const extractPathFromURL_1 = require("../fork/extractPathFromURL");
const getPathFromState_1 = __importDefault(require("../fork/getPathFromState"));
exports.getPathFromState = getPathFromState_1.default;
const getStateFromPath_1 = __importDefault(require("../fork/getStateFromPath"));
exports.getStateFromPath = getStateFromPath_1.default;
// A custom getInitialURL is used on native to ensure the app always starts at
// the root path if it's launched from something other than a deep link.
// This helps keep the native functionality working like the web functionality.
// For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
// then `/index` would be used on web and `/settings` would be used on native.
function getInitialURL() {
    if (process.env.NODE_ENV === 'test') {
        return Linking.getInitialURL() ?? getRootURL();
    }
    if (react_native_1.Platform.OS === 'web') {
        if (typeof window === 'undefined') {
            return '';
        }
        else if (typeof window.location?.href === 'string') {
            return window.location.href;
        }
    }
    return Promise.race([
        (async () => {
            const url = await Linking.getInitialURL();
            // NOTE(EvanBacon): This could probably be wrapped with the development boundary
            // since Expo Go is mostly just used in development.
            // Expo Go is weird and requires the root path to be `/--/`
            if (url && expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.StoreClient) {
                const parsed = Linking.parse(url);
                // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
                // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
                if (parsed.path === null ||
                    ['', '/'].includes((0, extractPathFromURL_1.adjustPathname)({
                        hostname: parsed.hostname,
                        pathname: parsed.path,
                    }))) {
                    return getRootURL();
                }
            }
            // The path will be nullish in bare apps when the app is launched from the home screen.
            // TODO(EvanBacon): define some policy around notifications.
            return url ?? getRootURL();
        })(),
        new Promise((resolve) => 
        // Timeout in 150ms if `getInitialState` doesn't resolve
        // Workaround for https://github.com/facebook/react-native/issues/25675
        setTimeout(() => resolve(getRootURL()), 150)),
    ]);
}
exports.getInitialURL = getInitialURL;
let _rootURL;
function getRootURL() {
    if (_rootURL === undefined) {
        _rootURL = Linking.createURL('/');
    }
    return _rootURL;
}
exports.getRootURL = getRootURL;
function addEventListener(listener) {
    let callback = undefined;
    if (expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.StoreClient) {
        // This extra work is only done in the Expo Go app.
        callback = ({ url }) => {
            const parsed = Linking.parse(url);
            // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
            // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
            if (parsed.path === null ||
                ['', '/'].includes((0, extractPathFromURL_1.adjustPathname)({ hostname: parsed.hostname, pathname: parsed.path }))) {
                listener(getRootURL());
            }
            else {
                listener(url);
            }
        };
    }
    else {
        callback = ({ url }) => listener(url);
    }
    const subscription = Linking.addEventListener('url', callback);
    return () => {
        // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
        subscription?.remove?.();
    };
}
exports.addEventListener = addEventListener;
//# sourceMappingURL=linking.js.map