import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'expo-modules-core';
import { dismissAuthSession } from 'expo-web-browser';
import { AuthRequest } from './AuthRequest';
import { resolveDiscoveryAsync } from './Discovery';
import sessionUrlProvider from './SessionUrlProvider';
// @needsAudit
/**
 * Cancels an active `AuthSession` if there is one.
 */
export function dismiss() {
    dismissAuthSession();
}
export const getDefaultReturnUrl = sessionUrlProvider.getDefaultReturnUrl;
// @needsAudit @docsMissing
/**
 * Get the URL that your authentication provider needs to redirect to. For example: `https://auth.expo.io/@your-username/your-app-slug`. You can pass an additional path component to be appended to the default redirect URL.
 * > **Note** This method will throw an exception if you're using the bare workflow on native.
 *
 * @param path
 * @return
 *
 * @example
 * ```ts
 * const url = AuthSession.getRedirectUrl('redirect');
 *
 * // Managed: https://auth.expo.io/@your-username/your-app-slug/redirect
 * // Web: https://localhost:19006/redirect
 * ```
 *
 * @deprecated Use `makeRedirectUri()` instead.
 */
export function getRedirectUrl(path) {
    return sessionUrlProvider.getRedirectUrl({ urlPath: path });
}
// @needsAudit
/**
 * Create a redirect url for the current platform and environment. You need to manually define the redirect that will be used in
 * a bare workflow React Native app, or an Expo standalone app, this is because it cannot be inferred automatically.
 * - **Web:** Generates a path based on the current `window.location`. For production web apps, you should hard code the URL as well.
 * - **Managed workflow:** Uses the `scheme` property of your app config.
 * - **Bare workflow:** Will fallback to using the `native` option for bare workflow React Native apps.
 *
 * @param options Additional options for configuring the path.
 * @return The `redirectUri` to use in an authentication request.
 *
 * @example
 * ```ts
 * const redirectUri = makeRedirectUri({
 *   scheme: 'my-scheme',
 *   path: 'redirect'
 * });
 * // Development Build: my-scheme://redirect
 * // Expo Go: exp://127.0.0.1:8081/--/redirect
 * // Web dev: https://localhost:19006/redirect
 * // Web prod: https://yourwebsite.com/redirect
 *
 * const redirectUri2 = makeRedirectUri({
 *   scheme: 'scheme2',
 *   preferLocalhost: true,
 *   isTripleSlashed: true,
 * });
 * // Development Build: scheme2:///
 * // Expo Go: exp://localhost:8081
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 * ```
 */
export function makeRedirectUri({ native, scheme, isTripleSlashed, queryParams, path, preferLocalhost, } = {}) {
    if (Platform.OS !== 'web' &&
        native &&
        [ExecutionEnvironment.Standalone, ExecutionEnvironment.Bare].includes(Constants.executionEnvironment)) {
        // Should use the user-defined native scheme in standalone builds
        return native;
    }
    const url = Linking.createURL(path || '', {
        isTripleSlashed,
        scheme,
        queryParams,
    });
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
// @needsAudit
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config A valid [`AuthRequestConfig`](#authrequestconfig) that specifies what provider to use.
 * @param issuerOrDiscovery A loaded [`DiscoveryDocument`](#discoverydocument) or issuer URL.
 * (Only `authorizationEndpoint` is required for requesting an authorization code).
 * @return Returns an instance of `AuthRequest` that can be used to prompt the user for authorization.
 */
export async function loadAsync(config, issuerOrDiscovery) {
    const request = new AuthRequest(config);
    const discovery = await resolveDiscoveryAsync(issuerOrDiscovery);
    await request.makeAuthUrlAsync(discovery);
    return request;
}
//# sourceMappingURL=AuthSession.js.map