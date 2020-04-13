import { dismissAuthSession, openAuthSessionAsync } from 'expo-web-browser';
import { AuthRequest } from './AuthRequest';
import { CodeChallengeMethod, ResponseType, } from './AuthRequest.types';
import { fetchDiscoveryAsync, resolveDiscoveryAsync, } from './Discovery';
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
export function getRedirectUrl(path) {
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
    await request.buildUrlAsync(discovery);
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
export { AuthError } from './Errors';
export { AuthRequest, CodeChallengeMethod, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, };
//# sourceMappingURL=AuthSession.js.map