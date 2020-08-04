import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, Prompt, ResponseType } from './AuthRequest.types';
import { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, fetchDiscoveryAsync, Issuer, IssuerOrDiscovery, ProviderMetadata, resolveDiscoveryAsync } from './Discovery';
import { generateHexStringAsync } from './PKCE';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getDefaultReturnUrl(): string;
/**
 * Deprecated: Use `makeRedirectUri({ path, useProxy })` instead.
 *
 * @param path
 */
export declare function getRedirectUrl(path?: string): string;
/**
 * Create a redirect url for the current platform.
 * - **Web:** Generates a path based on the current \`window.location\`. For production web apps you should hard code the URL.
 * - **Managed, and Custom workflow:** Uses the `scheme` property of your `app.config.js` or `app.json`.
 *   - **Proxy:** Uses auth.expo.io as the base URL for the path. This only works in Expo client and standalone environments.
 * - **Bare workflow:** Will fallback to using the `native` option for bare workflow React Native apps.
 *
 * @param options Additional options for configuring the path.
 */
export declare function makeRedirectUri({ native, path, preferLocalhost, useProxy, }?: AuthSessionRedirectUriOptions): string;
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config
 * @param issuerOrDiscovery
 */
export declare function loadAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
export * from './AuthRequestHooks';
export { AuthError, TokenError } from './Errors';
export { AuthSessionOptions, AuthSessionRedirectUriOptions, AuthSessionResult, AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, DiscoveryDocument, Issuer, IssuerOrDiscovery, Prompt, ProviderMetadata, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, generateHexStringAsync, };
export { TokenResponse, AccessTokenRequest, RefreshTokenRequest, RevokeTokenRequest, revokeAsync, refreshAsync, exchangeCodeAsync, fetchUserInfoAsync, } from './TokenRequest';
export * from './TokenRequest.types';
