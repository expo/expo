import { AuthRequest, AuthRequestPromptOptions, AuthSessionRedirectUriOptions, AuthSessionResult, DiscoveryDocument } from '../AuthSession';
import { ProviderAuthRequestConfig } from './Provider.types';
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
 * - [Get Started](https://docs.expo.io/guides/authentication/#facebook)
 *
 * @param config
 * @param discovery
 */
export declare function useAuthRequest(config?: Partial<FacebookAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [FacebookAuthRequest | null, AuthSessionResult | null, (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
export {};
