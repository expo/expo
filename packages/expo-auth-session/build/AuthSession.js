import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { dismissAuthSession, openAuthSessionAsync } from 'expo-web-browser';
import { AuthRequest } from './AuthRequest';
import { CodeChallengeMethod, Prompt, ResponseType, } from './AuthRequest.types';
import { fetchDiscoveryAsync, resolveDiscoveryAsync, } from './Discovery';
import { generateHexStringAsync } from './PKCE';
import { getQueryParams } from './QueryParams';
import { getSessionUrlProvider } from './SessionUrlProvider';
let _authLock = false;
const sessionUrlProvider = getSessionUrlProvider();
export async function startAsync(options) {
    const returnUrl = options.returnUrl || sessionUrlProvider.getDefaultReturnUrl();
    const authUrl = options.authUrl;
    const startUrl = sessionUrlProvider.getStartUrl(authUrl, returnUrl);
    const showInRecents = options.showInRecents || false;
    // Prevent accidentally starting to an empty url
    if (!authUrl) {
        throw new Error('No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.');
    }
    // Prevent multiple sessions from running at the same time, WebBrowser doesn't
    // support it this makes the behavior predictable.
    if (_authLock) {
        if (__DEV__) {
            console.warn('Attempted to call AuthSession.startAsync multiple times while already active. Only one AuthSession can be active at any given time.');
        }
        return { type: 'locked' };
    }
    // About to start session, set lock
    _authLock = true;
    let result;
    try {
        result = await _openWebBrowserAsync(startUrl, returnUrl, showInRecents);
    }
    finally {
        // WebBrowser session complete, unset lock
        _authLock = false;
    }
    // Handle failures
    if (!result) {
        throw new Error('Unexpected missing AuthSession result');
    }
    if (!result.url) {
        if (result.type) {
            return result;
        }
        else {
            throw new Error('Unexpected AuthSession result with missing type');
        }
    }
    const { params, errorCode } = getQueryParams(result.url);
    return {
        type: errorCode ? 'error' : 'success',
        params,
        errorCode,
        url: result.url,
    };
}
export function dismiss() {
    dismissAuthSession();
}
export function getDefaultReturnUrl() {
    return sessionUrlProvider.getDefaultReturnUrl();
}
/**
 * Deprecated: Use `makeRedirectUri({ path, useProxy })` instead.
 *
 * @param path
 */
export function getRedirectUrl(path) {
    return sessionUrlProvider.getRedirectUrl(path);
}
/**
 * Create a redirect url for the current platform.
 * - **Web:** Generates a path based on the current \`window.location\`. For production web apps you should hard code the URL.
 * - **Managed, and Custom workflow:** Uses the `scheme` property of your `app.config.js` or `app.json`.
 *   - **Proxy:** Uses auth.expo.io as the base URL for the path. This only works in Expo client and standalone environments.
 * - **Bare workflow:** Will fallback to using the `native` option for bare workflow React Native apps.
 *
 * @param options Additional options for configuring the path.
 */
export function makeRedirectUri({ native, path, preferLocalhost, useProxy, } = {}) {
    if (Platform.OS !== 'web') {
        // Bare workflow
        if (!Constants.manifest) {
            if (!native) {
                // TODO(Bacon): Link to docs or fyi
                console.warn("makeRedirectUri requires you define a `native` scheme for bare workflow, and standalone native apps, you'll need to manually define it based on your app's URI schemes.");
            }
            // Returning an empty string makes types easier to work with.
            // Server will throw an error about the invalid URI scheme.
            return native || '';
        }
        // Should use the user-defined native scheme in standalone builds
        if (Constants.appOwnership === 'standalone' && native) {
            return native;
        }
    }
    if (!useProxy || Platform.OS === 'web') {
        const url = Linking.makeUrl(path);
        if (preferLocalhost) {
            const ipAddress = url.match(/\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/);
            // Only replace if an IP address exists
            if (ipAddress?.length) {
                const [protocol, path] = url.split(ipAddress[0]);
                return `${protocol}localhost${path}`;
            }
        }
        return url;
    }
    // Attempt to use the proxy
    return sessionUrlProvider.getRedirectUrl(path);
}
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config
 * @param issuerOrDiscovery
 */
export async function loadAsync(config, issuerOrDiscovery) {
    const request = new AuthRequest(config);
    const discovery = await resolveDiscoveryAsync(issuerOrDiscovery);
    await request.makeAuthUrlAsync(discovery);
    return request;
}
async function _openWebBrowserAsync(startUrl, returnUrl, showInRecents) {
    // $FlowIssue: Flow thinks the awaited result can be a promise
    const result = await openAuthSessionAsync(startUrl, returnUrl, { showInRecents });
    if (result.type === 'cancel' || result.type === 'dismiss') {
        return { type: result.type };
    }
    return result;
}
export * from './AuthRequestHooks';
export { AuthError, TokenError } from './Errors';
export { AuthRequest, CodeChallengeMethod, Prompt, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, generateHexStringAsync, };
export { 
// Token classes
TokenResponse, AccessTokenRequest, RefreshTokenRequest, RevokeTokenRequest, 
// Token methods
revokeAsync, refreshAsync, exchangeCodeAsync, fetchUserInfoAsync, } from './TokenRequest';
// Token types
export * from './TokenRequest.types';
//# sourceMappingURL=AuthSession.js.map