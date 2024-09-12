import { ProviderAuthRequestConfig } from './Provider.types';
import { AuthRequest } from '../AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from '../AuthRequest.types';
import { AuthSessionRedirectUriOptions, AuthSessionResult } from '../AuthSession.types';
import { DiscoveryDocument } from '../Discovery';
export declare const discovery: DiscoveryDocument;
/**
 * @deprecated See [Google authentication](/guides/google-authentication/).
 */
export type GoogleAuthRequestConfig = ProviderAuthRequestConfig & {
    /**
     * If the user's email address is known ahead of time, it can be supplied to be the default option.
     * If the user has approved access for this app in the past then auth may return without any further interaction.
     */
    loginHint?: string;
    /**
     * When `true`, the service will allow the user to switch between accounts (if possible).
     * @default false.
     */
    selectAccount?: boolean;
    /**
     * Expo web client ID for use in the browser.
     */
    webClientId?: string;
    /**
     * iOS native client ID for use in standalone, bare workflow, and custom clients.
     */
    iosClientId?: string;
    /**
     * Android native client ID for use in standalone, and bare workflow.
     */
    androidClientId?: string;
    /**
     * Should the hook automatically exchange the response code for an authentication token.
     *
     * Defaults to `true` on installed apps (Android, iOS) when `ResponseType.Code` is used (default).
     */
    shouldAutoExchangeCode?: boolean;
    /**
     * Language code ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
     */
    language?: string;
};
/**
 * Extends [`AuthRequest`](#authrequest) and accepts [`GoogleAuthRequestConfig`](#googleauthrequestconfig) in the constructor.
 */
declare class GoogleAuthRequest extends AuthRequest {
    nonce?: string;
    constructor({ language, loginHint, selectAccount, extraParams, clientSecret, ...config }: GoogleAuthRequestConfig);
    /**
     * Load and return a valid auth request based on the input config.
     */
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
}
/**
 * Load an authorization request with an ID Token for authentication with Firebase.
 *
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * The id token can be retrieved with `response.params.id_token`.
 *
 * - [Get Started](https://docs.expo.dev/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export declare function useIdTokenAuthRequest(config: Partial<GoogleAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [
    GoogleAuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
];
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes, then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.dev/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export declare function useAuthRequest(config?: Partial<GoogleAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [
    GoogleAuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
];
export {};
//# sourceMappingURL=Google.d.ts.map