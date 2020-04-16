import { UnavailabilityError } from '@unimodules/core';
import { AppState, Linking, Platform } from 'react-native';
import ExponentWebBrowser from './ExpoWebBrowser';
import { WebBrowserResultType, } from './WebBrowser.types';
export { WebBrowserResultType, };
const emptyCustomTabsPackages = {
    defaultBrowserPackage: undefined,
    preferredBrowserPackage: undefined,
    browserPackages: [],
    servicePackages: [],
};
export async function getCustomTabsSupportingBrowsersAsync() {
    if (!ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync) {
        throw new UnavailabilityError('WebBrowser', 'getCustomTabsSupportingBrowsersAsync');
    }
    if (Platform.OS !== 'android') {
        return emptyCustomTabsPackages;
    }
    else {
        return await ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync();
    }
}
export async function warmUpAsync(browserPackage) {
    if (!ExponentWebBrowser.warmUpAsync) {
        throw new UnavailabilityError('WebBrowser', 'warmUpAsync');
    }
    if (Platform.OS !== 'android') {
        return {};
    }
    else {
        return await ExponentWebBrowser.warmUpAsync(browserPackage);
    }
}
export async function mayInitWithUrlAsync(url, browserPackage) {
    if (!ExponentWebBrowser.mayInitWithUrlAsync) {
        throw new UnavailabilityError('WebBrowser', 'mayInitWithUrlAsync');
    }
    if (Platform.OS !== 'android') {
        return {};
    }
    else {
        return await ExponentWebBrowser.mayInitWithUrlAsync(url, browserPackage);
    }
}
export async function coolDownAsync(browserPackage) {
    if (!ExponentWebBrowser.coolDownAsync) {
        throw new UnavailabilityError('WebBrowser', 'coolDownAsync');
    }
    if (Platform.OS !== 'android') {
        return {};
    }
    else {
        return await ExponentWebBrowser.coolDownAsync(browserPackage);
    }
}
export async function openBrowserAsync(url, browserParams = {}) {
    if (!ExponentWebBrowser.openBrowserAsync) {
        throw new UnavailabilityError('WebBrowser', 'openBrowserAsync');
    }
    return await ExponentWebBrowser.openBrowserAsync(url, browserParams);
}
export function dismissBrowser() {
    if (!ExponentWebBrowser.dismissBrowser) {
        throw new UnavailabilityError('WebBrowser', 'dismissBrowser');
    }
    ExponentWebBrowser.dismissBrowser();
}
export async function openAuthSessionAsync(url, redirectUrl, browserParams = {}) {
    if (_authSessionIsNativelySupported()) {
        if (!ExponentWebBrowser.openAuthSessionAsync) {
            throw new UnavailabilityError('WebBrowser', 'openAuthSessionAsync');
        }
        return ExponentWebBrowser.openAuthSessionAsync(url, redirectUrl);
    }
    else {
        return _openAuthSessionPolyfillAsync(url, redirectUrl, browserParams);
    }
}
export function dismissAuthSession() {
    if (_authSessionIsNativelySupported()) {
        if (!ExponentWebBrowser.dismissAuthSession) {
            throw new UnavailabilityError('WebBrowser', 'dismissAuthSession');
        }
        ExponentWebBrowser.dismissAuthSession();
    }
    else {
        if (!ExponentWebBrowser.dismissBrowser) {
            throw new UnavailabilityError('WebBrowser', 'dismissAuthSession');
        }
        ExponentWebBrowser.dismissBrowser();
    }
}
/* iOS <= 10 and Android polyfill for SFAuthenticationSession flow */
function _authSessionIsNativelySupported() {
    if (Platform.OS === 'android') {
        return false;
    }
    const versionNumber = parseInt(String(Platform.Version), 10);
    return versionNumber >= 11;
}
let _redirectHandler = null;
/*
 * openBrowserAsync on Android doesn't wait until closed, so we need to polyfill
 * it with AppState
 */
// Store the `resolve` function from a Promise to fire when the AppState
// returns to active
let _onWebBrowserCloseAndroid = null;
// If the initial AppState.currentState is null, we assume that the first call to
// AppState#change event is not actually triggered by a real change,
// is triggered instead by the bridge capturing the current state
// (https://facebook.github.io/react-native/docs/appstate#basic-usage)
let _isAppStateAvailable = AppState.currentState !== null;
function _onAppStateChangeAndroid(state) {
    if (!_isAppStateAvailable) {
        _isAppStateAvailable = true;
        return;
    }
    if (state === 'active' && _onWebBrowserCloseAndroid) {
        _onWebBrowserCloseAndroid();
    }
}
async function _openBrowserAndWaitAndroidAsync(startUrl, browserParams = {}) {
    const appStateChangedToActive = new Promise(resolve => {
        _onWebBrowserCloseAndroid = resolve;
        AppState.addEventListener('change', _onAppStateChangeAndroid);
    });
    let result = { type: 'cancel' };
    const { type } = await openBrowserAsync(startUrl, browserParams);
    if (type === 'opened') {
        await appStateChangedToActive;
        result = { type: 'dismiss' };
    }
    AppState.removeEventListener('change', _onAppStateChangeAndroid);
    _onWebBrowserCloseAndroid = null;
    return result;
}
async function _openAuthSessionPolyfillAsync(startUrl, returnUrl, browserParams = {}) {
    if (_redirectHandler) {
        throw new Error(`The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`);
    }
    if (_onWebBrowserCloseAndroid) {
        throw new Error(`WebBrowser is already open, only one can be open at a time`);
    }
    try {
        if (Platform.OS === 'android') {
            return await Promise.race([
                _openBrowserAndWaitAndroidAsync(startUrl, browserParams),
                _waitForRedirectAsync(returnUrl),
            ]);
        }
        else {
            return await Promise.race([
                openBrowserAsync(startUrl, browserParams),
                _waitForRedirectAsync(returnUrl),
            ]);
        }
    }
    finally {
        // We can't dismiss the browser on Android, only call this when it's available.
        // Users on Android need to manually press the 'x' button in Chrome Custom Tabs, sadly.
        if (ExponentWebBrowser.dismissBrowser) {
            ExponentWebBrowser.dismissBrowser();
        }
        _stopWaitingForRedirect();
    }
}
function _stopWaitingForRedirect() {
    if (!_redirectHandler) {
        throw new Error(`The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`);
    }
    Linking.removeEventListener('url', _redirectHandler);
    _redirectHandler = null;
}
function _waitForRedirectAsync(returnUrl) {
    return new Promise(resolve => {
        _redirectHandler = (event) => {
            if (event.url.startsWith(returnUrl)) {
                resolve({ url: event.url, type: 'success' });
            }
        };
        Linking.addEventListener('url', _redirectHandler);
    });
}
//# sourceMappingURL=WebBrowser.js.map