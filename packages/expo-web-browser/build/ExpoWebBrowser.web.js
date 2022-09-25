import compareUrls from 'compare-urls';
import { CodedError, Platform } from 'expo-modules-core';
import { AppState, Dimensions } from 'react-native';
import { WebBrowserResultType, } from './WebBrowser.types';
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 650;
let popupWindow = null;
const listenerMap = new Map();
const getHandle = () => 'ExpoWebBrowserRedirectHandle';
const getOriginUrlHandle = (hash) => `ExpoWebBrowser_OriginUrl_${hash}`;
const getRedirectUrlHandle = (hash) => `ExpoWebBrowser_RedirectUrl_${hash}`;
function dismissPopup() {
    if (!popupWindow) {
        return;
    }
    popupWindow.close();
    if (listenerMap.has(popupWindow)) {
        const { listener, appStateSubscription, interval } = listenerMap.get(popupWindow);
        clearInterval(interval);
        window.removeEventListener('message', listener);
        appStateSubscription.remove();
        listenerMap.delete(popupWindow);
        const handle = window.localStorage.getItem(getHandle());
        if (handle) {
            window.localStorage.removeItem(getHandle());
            window.localStorage.removeItem(getOriginUrlHandle(handle));
            window.localStorage.removeItem(getRedirectUrlHandle(handle));
        }
        popupWindow = null;
    }
}
export default {
    get name() {
        return 'ExpoWebBrowser';
    },
    async openBrowserAsync(url, browserParams = {}) {
        if (!Platform.isDOMAvailable)
            return { type: WebBrowserResultType.CANCEL };
        const { windowName = '_blank', windowFeatures } = browserParams;
        const features = getPopupFeaturesString(windowFeatures);
        window.open(url, windowName, features);
        return { type: WebBrowserResultType.OPENED };
    },
    dismissAuthSession() {
        if (!Platform.isDOMAvailable)
            return;
        dismissPopup();
    },
    maybeCompleteAuthSession({ skipRedirectCheck }) {
        if (!Platform.isDOMAvailable) {
            return {
                type: 'failed',
                message: 'Cannot use expo-web-browser in a non-browser environment',
            };
        }
        const handle = window.localStorage.getItem(getHandle());
        if (!handle) {
            return { type: 'failed', message: 'No auth session is currently in progress' };
        }
        const url = window.location.href;
        if (skipRedirectCheck !== true) {
            const redirectUrl = window.localStorage.getItem(getRedirectUrlHandle(handle));
            // Compare the original redirect url against the current url with it's query params removed.
            const currentUrl = window.location.origin + window.location.pathname;
            if (!compareUrls(redirectUrl, currentUrl)) {
                return {
                    type: 'failed',
                    message: `Current URL "${currentUrl}" and original redirect URL "${redirectUrl}" do not match.`,
                };
            }
        }
        // Save the link for app state listener
        window.localStorage.setItem(getOriginUrlHandle(handle), url);
        // Get the window that created the current popup
        const parent = window.opener ?? window.parent;
        if (!parent) {
            throw new CodedError('ERR_WEB_BROWSER_REDIRECT', `The window cannot complete the redirect request because the invoking window doesn't have a reference to it's parent. This can happen if the parent window was reloaded.`);
        }
        // Send the URL back to the opening window.
        parent.postMessage({ url, expoSender: handle }, parent.location.toString());
        return { type: 'success', message: `Attempting to complete auth` };
        // Maybe set timer to throw an error if the window is still open after attempting to complete.
    },
    // This method should be invoked from user input.
    async openAuthSessionAsync(url, redirectUrl, openOptions) {
        if (!Platform.isDOMAvailable)
            return { type: WebBrowserResultType.CANCEL };
        redirectUrl = redirectUrl ?? getRedirectUrlFromUrlOrGenerate(url);
        if (popupWindow == null || popupWindow?.closed) {
            const features = getPopupFeaturesString(openOptions?.windowFeatures);
            popupWindow = window.open(url, openOptions?.windowName, features);
            if (popupWindow) {
                try {
                    popupWindow.focus();
                }
                catch { }
            }
            else {
                throw new CodedError('ERR_WEB_BROWSER_BLOCKED', 'Popup window was blocked by the browser or failed to open. This can happen in mobile browsers when the window.open() method was invoked too long after a user input was fired.');
            }
        }
        const state = await getStateFromUrlOrGenerateAsync(url);
        // Save handle for session
        window.localStorage.setItem(getHandle(), state);
        // Save redirect Url for further verification
        window.localStorage.setItem(getRedirectUrlHandle(state), redirectUrl);
        return new Promise(async (resolve) => {
            // Create a listener for messages sent from the popup
            const listener = (event) => {
                if (!event.isTrusted)
                    return;
                // Ensure we trust the sender.
                if (event.origin !== window.location.origin) {
                    return;
                }
                const { data } = event;
                // Use a crypto hash to invalid message.
                const handle = window.localStorage.getItem(getHandle());
                // Ensure the sender is also from expo-web-browser
                if (data.expoSender === handle) {
                    dismissPopup();
                    resolve({ type: 'success', url: data.url });
                }
            };
            // Add a listener for receiving messages from the popup.
            window.addEventListener('message', listener, false);
            // Create an app state listener as a fallback to the popup listener
            const appStateListener = (state) => {
                if (state !== 'active') {
                    return;
                }
                const handle = window.localStorage.getItem(getHandle());
                if (handle) {
                    const url = window.localStorage.getItem(getOriginUrlHandle(handle));
                    if (url) {
                        dismissPopup();
                        resolve({ type: 'success', url });
                    }
                }
            };
            const appStateSubscription = AppState.addEventListener('change', appStateListener);
            // Check if the window has been closed every second.
            const interval = setInterval(() => {
                if (popupWindow?.closed) {
                    if (resolve)
                        resolve({ type: WebBrowserResultType.DISMISS });
                    clearInterval(interval);
                    dismissPopup();
                }
            }, 1000);
            // Store the listener and interval for clean up.
            listenerMap.set(popupWindow, {
                listener,
                interval,
                appStateSubscription,
            });
        });
    },
};
// Crypto
function isCryptoAvailable() {
    if (!Platform.isDOMAvailable)
        return false;
    return !!window?.crypto;
}
function isSubtleCryptoAvailable() {
    if (!isCryptoAvailable())
        return false;
    return !!window.crypto.subtle;
}
async function getStateFromUrlOrGenerateAsync(inputUrl) {
    const url = new URL(inputUrl);
    if (url.searchParams.has('state') && typeof url.searchParams.get('state') === 'string') {
        // Ensure we reuse the auth state if it's passed in.
        return url.searchParams.get('state');
    }
    // Generate a crypto state for verifying the return popup.
    return await generateStateAsync();
}
function getRedirectUrlFromUrlOrGenerate(inputUrl) {
    const url = new URL(inputUrl);
    if (url.searchParams.has('redirect_uri') &&
        typeof url.searchParams.get('redirect_uri') === 'string') {
        // Ensure we reuse the redirect_uri if it's passed in the input url.
        return url.searchParams.get('redirect_uri');
    }
    // Emulate how native uses Constants.linkingUrl
    return location.origin + location.pathname;
}
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
async function generateStateAsync() {
    if (!isSubtleCryptoAvailable()) {
        throw new CodedError('ERR_WEB_BROWSER_CRYPTO', `The current environment doesn't support crypto. Ensure you are running from a secure origin (https).`);
    }
    const encoder = new TextEncoder();
    const data = generateRandom(10);
    const buffer = encoder.encode(data);
    const hashedData = await crypto.subtle.digest('SHA-256', buffer);
    const state = btoa(String.fromCharCode(...new Uint8Array(hashedData)));
    return state;
}
function generateRandom(size) {
    let arr = new Uint8Array(size);
    if (arr.byteLength !== arr.length) {
        arr = new Uint8Array(arr.buffer);
    }
    const array = new Uint8Array(arr.length);
    if (isCryptoAvailable()) {
        window.crypto.getRandomValues(array);
    }
    else {
        for (let i = 0; i < size; i += 1) {
            array[i] = (Math.random() * CHARSET.length) | 0;
        }
    }
    return bufferToString(array);
}
function bufferToString(buffer) {
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join('');
}
// Window Features
// Ensure feature string is an object
function normalizePopupFeaturesString(options) {
    let windowFeatures = {};
    // This should be avoided because it adds extra time to the popup command.
    if (typeof options === 'string') {
        // Convert string of `key=value,foo=bar` into an object
        const windowFeaturePairs = options.split(',');
        for (const pair of windowFeaturePairs) {
            const [key, value] = pair.trim().split('=');
            if (key && value) {
                windowFeatures[key] = value;
            }
        }
    }
    else if (options) {
        windowFeatures = options;
    }
    return windowFeatures;
}
// Apply default values to the input feature set
function getPopupFeaturesString(options) {
    const windowFeatures = normalizePopupFeaturesString(options);
    const width = windowFeatures.width ?? POPUP_WIDTH;
    const height = windowFeatures.height ?? POPUP_HEIGHT;
    const dimensions = Dimensions.get('screen');
    const top = windowFeatures.top ?? Math.max(0, (dimensions.height - height) * 0.5);
    const left = windowFeatures.left ?? Math.max(0, (dimensions.width - width) * 0.5);
    // Create a reasonable popup
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/open#Window_features
    return featureObjectToString({
        ...windowFeatures,
        // Toolbar buttons (Back, Forward, Reload, Stop buttons).
        toolbar: windowFeatures.toolbar ?? 'no',
        menubar: windowFeatures.menubar ?? 'no',
        // Shows the location bar or the address bar.
        location: windowFeatures.location ?? 'yes',
        resizable: windowFeatures.resizable ?? 'yes',
        // If this feature is on, then the new secondary window has a status bar.
        status: windowFeatures.status ?? 'no',
        scrollbars: windowFeatures.scrollbars ?? 'yes',
        top,
        left,
        width,
        height,
    });
}
export function featureObjectToString(features) {
    return Object.keys(features).reduce((prev, current) => {
        let value = features[current];
        if (typeof value === 'boolean') {
            value = value ? 'yes' : 'no';
        }
        if (current && value) {
            if (prev)
                prev += ',';
            return `${prev}${current}=${value}`;
        }
        return prev;
    }, '');
}
//# sourceMappingURL=ExpoWebBrowser.web.js.map