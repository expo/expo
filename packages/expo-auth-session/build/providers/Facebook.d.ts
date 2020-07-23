import { AuthRequest, AuthRequestPromptOptions, AuthSessionResult, DiscoveryDocument, AuthSessionRedirectUriOptions } from '../AuthSession';
import { TokenResponse } from '../TokenRequest';
import { ProviderAuthRequestConfig, ProviderUser } from './Provider.types';
export declare const discovery: DiscoveryDocument;
export interface FacebookAuthRequestConfig extends ProviderAuthRequestConfig {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
    expoClientId?: string;
}
declare class FacebookAuthRequest extends AuthRequest {
    constructor({ language, selectAccount, extraParams, clientSecret, ...config }: FacebookAuthRequestConfig);
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
export declare function useAuthRequest(config?: Partial<FacebookAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [FacebookAuthRequest | null, AuthSessionResult | null, (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
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
