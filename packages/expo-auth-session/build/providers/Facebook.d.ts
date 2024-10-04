import { AuthRequestConfig } from '../AuthRequest.types';
import { AuthRequest, AuthRequestPromptOptions, AuthSessionRedirectUriOptions, AuthSessionResult, DiscoveryDocument } from '../AuthSession';
import { ProviderAuthRequestConfig } from './Provider.types';
export declare const discovery: DiscoveryDocument;
export interface FacebookAuthRequestConfig extends ProviderAuthRequestConfig {
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
    /**
     * Proxy client ID for use when testing with Expo Go on Android and iOS.
     */
    expoClientId?: string;
}
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