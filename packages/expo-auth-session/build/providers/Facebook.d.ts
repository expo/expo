import { ProviderAuthRequestConfig } from './Provider.types';
import { AuthRequest } from '../AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from '../AuthRequest.types';
import { AuthSessionRedirectUriOptions, AuthSessionResult } from '../AuthSession.types';
import { DiscoveryDocument } from '../Discovery';
export declare const discovery: DiscoveryDocument;
/**
 * @deprecated See [Facebook authentication](/guides/facebook-authentication/).
 */
export type FacebookAuthRequestConfig = ProviderAuthRequestConfig & {
    /**
     * Expo web client ID for use in the browser.
     */
    webClientId?: string;
    /**
     * iOS native client ID for use in development builds and bare workflow.
     */
    iosClientId?: string;
    /**
     * Android native client ID for use in development builds and bare workflow.
     */
    androidClientId?: string;
};
/**
 * Extends [`AuthRequest`](#authrequest) and accepts [`FacebookAuthRequest`](#facebookauthrequest) in the constructor.
 */
declare class FacebookAuthRequest extends AuthRequest {
    nonce?: string;
    constructor({ language, extraParams, clientSecret, ...config }: FacebookAuthRequestConfig);
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
 * - [Get Started](https://docs.expo.dev/guides/authentication/#facebook)
 *
 * @param config
 * @param redirectUriOptions
 */
export declare function useAuthRequest(config?: Partial<FacebookAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [
    FacebookAuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
];
export {};
//# sourceMappingURL=Facebook.d.ts.map