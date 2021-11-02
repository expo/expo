import * as Linking from 'expo-linking';
import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, Prompt, ResponseType } from './AuthRequest.types';
import { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, fetchDiscoveryAsync, Issuer, IssuerOrDiscovery, ProviderMetadata, resolveDiscoveryAsync } from './Discovery';
import { generateHexStringAsync } from './PKCE';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare const getDefaultReturnUrl: (urlPath?: string | undefined, options?: Omit<Linking.CreateURLOptions, "queryParams"> | undefined) => string;
/**
 * @deprecated Use `makeRedirectUri({ path, useProxy })` instead.
 *
 * @param path
 */
export declare function getRedirectUrl(path?: string): string;
/**
 * Create a redirect url for the current platform.
 *
 * - **Web:** Generates a path based on the current \`window.location\`. For production web apps you should hard code the URL.
 * - **Managed:** Uses the `scheme` property of your `app.config.js` or `app.json`.
 *   - **Proxy:** Uses auth.expo.io as the base URL for the path. This only works in Expo client and standalone environments.
 * - **Bare workflow:** Provide either the `scheme` or a manual `native` property to use.
 *
 * @param options Additional options for configuring the path.
 *
 * @example
 * ```ts
 * const redirectUri = makeRedirectUri({
 *   scheme: 'my-scheme',
 *   path: 'redirect'
 * });
 * // Custom app: my-scheme://redirect
 * // Expo Go: exp://127.0.0.1:19000/--/redirect
 * // Web dev: https://localhost:19006/redirect
 * // Web prod: https://yourwebsite.com/redirect
 *
 * const redirectUri2 = makeRedirectUri({
 *   scheme: 'scheme2',
 *   preferLocalhost: true,
 *   isTripleSlashed: true,
 * });
 * // Custom app: scheme2:///
 * // Expo Go: exp://localhost:19000
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 * ```
 *
 * const redirectUri3 = makeRedirectUri({
 *   useProxy: true,
 * });
 * // Custom app: https://auth.expo.io/@username/slug
 * // Expo Go: https://auth.expo.io/@username/slug
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 * ```
 */
export declare function makeRedirectUri({ native, scheme, isTripleSlashed, queryParams, path, preferLocalhost, useProxy, }?: AuthSessionRedirectUriOptions): string;
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config
 * @param issuerOrDiscovery
 */
export declare function loadAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
export { useAutoDiscovery, useAuthRequest } from './AuthRequestHooks';
export { AuthError, TokenError } from './Errors';
export { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult, AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, DiscoveryDocument, Issuer, IssuerOrDiscovery, Prompt, ProviderMetadata, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, generateHexStringAsync, };
export { TokenResponse, AccessTokenRequest, RefreshTokenRequest, RevokeTokenRequest, revokeAsync, refreshAsync, exchangeCodeAsync, fetchUserInfoAsync, } from './TokenRequest';
export * from './TokenRequest.types';
