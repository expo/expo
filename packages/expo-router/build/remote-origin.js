"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRemoteOriginDevTool = exports.promptChangeServer = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const expo_linking_1 = require("expo-linking");
const react_1 = require("react");
const react_native_1 = require("react-native");
const getDevServer_1 = __importDefault(require("react-native/Libraries/Core/Devtools/getDevServer"));
const extractPathFromURL_1 = require("./fork/extractPathFromURL");
const manifest = expo_constants_1.default.expoConfig;
function getCurrentRemoteOrigin() {
    return localStorage.getItem('expo_remote_origin') ?? getBaseUrl();
}
// TODO: This would be better if native and tied as close to the JS engine as possible, i.e. it should
// reflect the exact location of the JS file that was executed.
function getBaseUrl() {
    if ((0, getDevServer_1.default)().bundleLoadedFromServer) {
        // if (process.env.NODE_ENV !== 'production') {
        // e.g. http://localhost:19006
        return (0, getDevServer_1.default)().url?.replace(/\/$/, '');
    }
    // TODO: Make it official by moving out of `extra`
    const productionBaseUrl = manifest?.extra?.router?.origin;
    if (!productionBaseUrl) {
        return null;
    }
    // Ensure no trailing slash
    return productionBaseUrl?.replace(/\/$/, '');
}
const remote = {
    getDefault: getBaseUrl,
    getCurrent: getCurrentRemoteOrigin,
    prompt: promptChangeServer,
    reset() {
        localStorage.removeItem('expo_remote_origin');
        // NOTE: No standard way to restart the app. This will just throw an error that breaks the app lol.
        globalThis.location.reload();
    },
};
function promptChangeServer(currentUrl = getCurrentRemoteOrigin(), placeholder) {
    react_native_1.Alert.prompt('Change Remote Origin', `Enter a new remote origin (current: ${currentUrl}):`, [
        {
            text: 'Cancel',
            onPress: () => { },
            style: 'cancel',
        },
        {
            text: 'OK',
            onPress: (newOrigin) => {
                if (!newOrigin) {
                    remote.reset();
                    return;
                }
                newOrigin = newOrigin.trim();
                if (newOrigin !== currentUrl) {
                    localStorage.setItem('expo_remote_origin', coerceUrl(newOrigin));
                    // NOTE: No standard way to restart the app. This will just throw an error that breaks the app lol.
                    globalThis.location.reload();
                }
            },
        },
    ], 'plain-text', placeholder, 'default');
}
exports.promptChangeServer = promptChangeServer;
globalThis.remote = remote;
// scheme://?__remote_origin=https://bacon.expo.app/
function useRemoteOriginDevTool() {
    // Enables changing the origin URL for the server. Useful for debugging release apps.
    // Deep link in with scheme://?__remote_origin=http://localhost:3000 to change the on-device origin. This will persist the value and reset the JS context.
    // Use `?__remote_origin=` to reset the origin.
    const url = (0, expo_linking_1.useURL)();
    (0, react_1.useEffect)(() => {
        if (!url || !url.match(/__remote_origin/)) {
            return;
        }
        const normal = (0, extractPathFromURL_1.extractExpoPathFromURL)(url);
        const parsed = new URL(normal, 'http://e');
        const remoteOrigin = parsed.searchParams.get('__remote_origin');
        console.log('[DEV TOOL]: Remote origin link found:', parsed.toString());
        if (remoteOrigin != null) {
            if (remoteOrigin) {
                const possibleUrl = coerceUrl(decodeURIComponent(remoteOrigin));
                const currentOrigin = getCurrentRemoteOrigin();
                if (currentOrigin === possibleUrl) {
                    alert('The remote origin is already set to the provided value: ' + remoteOrigin);
                    return;
                }
                promptChangeServer(currentOrigin, remoteOrigin);
            }
            else {
                react_native_1.Alert.prompt('Change Remote Origin', `Reset the remote origin to the default? (current: ${getCurrentRemoteOrigin()}, default: ${getBaseUrl()})`, [
                    {
                        text: 'Cancel',
                        onPress: () => { },
                        style: 'cancel',
                    },
                    {
                        text: 'OK',
                        onPress: () => {
                            localStorage.removeItem('expo_remote_origin');
                            globalThis.location.reload();
                        },
                    },
                ]);
            }
        }
    }, [url]);
}
exports.useRemoteOriginDevTool = useRemoteOriginDevTool;
function coerceUrl(urlString) {
    try {
        let nextUrl = new URL(urlString);
        // Ensure `http://` or `https://` is present
        if (!nextUrl.protocol) {
            nextUrl = new URL('http://' + urlString);
        }
        return nextUrl.toString();
    }
    catch {
        console.log('Failed coercing URL:', urlString);
        return urlString;
    }
}
//# sourceMappingURL=remote-origin.js.map