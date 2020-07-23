import { AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, AuthSessionResult, DiscoveryDocument } from '../AuthSession';
import { TokenResponse } from '../TokenRequest';
import { ProviderAuthRequestConfig, ProviderUser } from './Provider.types';
export declare const discovery: DiscoveryDocument;
export interface GoogleAuthRequestConfig extends ProviderAuthRequestConfig {
    /**
     * If the user's email address is known ahead of time, it can be supplied to be the default option.
     * If the user has approved access for this app in the past then auth may return without any further interaction.
     */
    loginHint?: string;
}
declare class GoogleAuthRequest extends AuthRequest {
    nonce?: string;
    constructor({ language, loginHint, selectAccount, extraParams, clientSecret, ...config }: GoogleAuthRequestConfig);
    /**
     * Load and return a valid auth request based on the input config.
     */
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
}
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 *  - TODO: Put Getting started guide URL here
 *
 * @param config
 * @param discovery
 */
export declare function useAuthRequest(config: GoogleAuthRequestConfig): [GoogleAuthRequest | null, AuthSessionResult | null, (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
/**
 * Fetch generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export declare function fetchUserInfoAsync(response: Pick<TokenResponse, 'accessToken'>): Promise<ProviderUser>;
export {};
