import * as Linking from 'expo-linking';
import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig } from './AuthRequest.types';
import { AuthSessionRedirectUriOptions } from './AuthSession.types';
import { IssuerOrDiscovery } from './Discovery';
/**
 * Cancels an active `AuthSession` if there is one.
 */
export declare function dismiss(): void;
export declare const getDefaultReturnUrl: (urlPath?: string, options?: Omit<Linking.CreateURLOptions, "queryParams">) => string;
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
export declare function getRedirectUrl(path?: string): string;
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
export declare function makeRedirectUri({ native, scheme, isTripleSlashed, queryParams, path, preferLocalhost, }?: AuthSessionRedirectUriOptions): string;
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config A valid [`AuthRequestConfig`](#authrequestconfig) that specifies what provider to use.
 * @param issuerOrDiscovery A loaded [`DiscoveryDocument`](#discoverydocument) or issuer URL.
 * (Only `authorizationEndpoint` is required for requesting an authorization code).
 * @return Returns an instance of `AuthRequest` that can be used to prompt the user for authorization.
 */
export declare function loadAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
//# sourceMappingURL=AuthSession.d.ts.map