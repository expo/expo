import * as Linking from 'expo-linking';
import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, Prompt, ResponseType } from './AuthRequest.types';
import { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, fetchDiscoveryAsync, Issuer, IssuerOrDiscovery, ProviderMetadata, resolveDiscoveryAsync } from './Discovery';
import { generateHexStringAsync } from './PKCE';
/**
 * Initiate a proxied authentication session with the given options. Only one `AuthSession` can be active at any given time in your application.
 * If you attempt to open a second session while one is still in progress, the second session will return a value to indicate that `AuthSession` is locked.
 *
 * @param options An object of type `AuthSessionOptions`.
 * @return Returns a Promise that resolves to an `AuthSessionResult` object.
 */
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
/**
 * Cancels an active `AuthSession` if there is one. No return value, but if there is an active `AuthSession`
 * then the Promise returned by the `AuthSession.startAsync()` that initiated it resolves to `{ type: 'dismiss' }`.
 */
export declare function dismiss(): void;
export declare const getDefaultReturnUrl: (urlPath?: string | undefined, options?: Omit<Linking.CreateURLOptions, "queryParams"> | undefined) => string;
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
 * @deprecated Use `makeRedirectUri({ path, useProxy })` instead.
 */
export declare function getRedirectUrl(path?: string): string;
/**
 * Create a redirect url for the current platform and environment. You need to manually define the redirect that will be used in
 * a bare workflow React Native app, or an Expo standalone app, this is because it cannot be inferred automatically.
 * - **Web:** Generates a path based on the current `window.location`. For production web apps, you should hard code the URL as well.
 * - **Managed workflow:** Uses the `scheme` property of your `app.config.js` or `app.json`.
 *   - **Proxy:** Uses `auth.expo.io` as the base URL for the path. This only works in Expo Go and standalone environments.
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
 * // Expo Go: exp://127.0.0.1:19000/--/redirect
 * // Web dev: https://localhost:19006/redirect
 * // Web prod: https://yourwebsite.com/redirect
 *
 * const redirectUri2 = makeRedirectUri({
 *   scheme: 'scheme2',
 *   preferLocalhost: true,
 *   isTripleSlashed: true,
 * });
 * // Development Build: scheme2:///
 * // Expo Go: exp://localhost:19000
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 *
 * const redirectUri3 = makeRedirectUri({
 *   useProxy: true,
 * });
 * // Development Build: https://auth.expo.io/@username/slug
 * // Expo Go: https://auth.expo.io/@username/slug
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 * ```
 */
export declare function makeRedirectUri({ native, scheme, isTripleSlashed, queryParams, path, preferLocalhost, useProxy, projectNameForProxy, }?: AuthSessionRedirectUriOptions): string;
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config A valid [`AuthRequestConfig`](#authrequestconfig) that specifies what provider to use.
 * @param issuerOrDiscovery A loaded [`DiscoveryDocument`](#discoverydocument) or issuer URL.
 * (Only `authorizationEndpoint` is required for requesting an authorization code).
 * @return Returns an instance of `AuthRequest` that can be used to prompt the user for authorization.
 */
export declare function loadAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
export { useAutoDiscovery, useAuthRequest } from './AuthRequestHooks';
export { AuthError, TokenError } from './Errors';
export { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult, AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, DiscoveryDocument, Issuer, IssuerOrDiscovery, Prompt, ProviderMetadata, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, generateHexStringAsync, };
export { TokenResponse, AccessTokenRequest, RefreshTokenRequest, RevokeTokenRequest, revokeAsync, refreshAsync, exchangeCodeAsync, fetchUserInfoAsync, } from './TokenRequest';
export * from './TokenRequest.types';
export { GoogleAuthRequestConfig } from './providers/Google';
export { FacebookAuthRequestConfig } from './providers/Facebook';
//# sourceMappingURL=AuthSession.d.ts.map