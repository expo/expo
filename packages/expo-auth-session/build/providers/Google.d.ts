import { AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, AuthSessionRedirectUriOptions, AuthSessionResult, DiscoveryDocument } from '../AuthSession';
import { ProviderAuthRequestConfig } from './Provider.types';
export declare const discovery: DiscoveryDocument;
export interface GoogleAuthRequestConfig extends ProviderAuthRequestConfig {
    /**
     * If the user's email address is known ahead of time, it can be supplied to be the default option.
     * If the user has approved access for this app in the past then auth may return without any further interaction.
     */
    loginHint?: string;
    /**
     * When `true`, the service will allow the user to switch between accounts (if possible). Defaults to `false`.
     */
    selectAccount?: boolean;
    /**
     * Proxy client ID for use in the Expo client on iOS and Android.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: Web Application
     * - **URIs**: https://auth.expo.io
     * - **Authorized redirect URIs**: https://auth.expo.io/@your-username/your-project-slug
     */
    expoClientId?: string;
    /**
     * Expo web client ID for use in the browser.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: Web Application
     * - **URIs**: https://yourwebsite.com | https://localhost:19006
     * - **Authorized redirect URIs**: https://yourwebsite.com | https://localhost:19006
     */
    webClientId?: string;
    /**
     * iOS native client ID for use in standalone, bare-workflow, and custom clients.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: iOS Application
     * - **Bundle ID**: Must match the value of `ios.bundleIdentifier` in your `app.json`.
     * - Your app needs to conform to the URI scheme matching your bundle identifier.
     *   - **Standalone**: Automatically added, do nothing.
     *   - **Bare-workflow**: Run `npx uri-scheme add <your bundle id> --ios`
     */
    iosClientId?: string;
    /**
     * Android native client ID for use in standalone, bare-workflow, and custom clients.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: Android Application
     * - **Package name**: Must match the value of `android.package` in your `app.json`.
     * - **Signing-certificate fingerprint**: Run `openssl rand -base64 32 | openssl sha1 -c` for the results.
     * - Your app needs to conform to the URI scheme matching your android package.
     *   - **Standalone**: Automatically added, do nothing.
     *   - **Bare-workflow**: Run `npx uri-scheme add <your android package> --android`
     */
    androidClientId?: string;
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
 * - [Get Started](https://docs.expo.io/guides/authentication/#google)
 *
 * @param config
 * @param discovery
 */
export declare function useAuthRequest(config?: Partial<GoogleAuthRequestConfig>, redirectUriOptions?: Partial<AuthSessionRedirectUriOptions>): [GoogleAuthRequest | null, AuthSessionResult | null, (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
export {};
