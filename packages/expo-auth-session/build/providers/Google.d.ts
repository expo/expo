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
     * When `true`, the service will allow the user to switch between accounts (if possible).
     * @default false.
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
     * - Give it a name (e.g. "Web App").
     * - **URIs** (Authorized JavaScript origins): https://localhost:19006 & https://yourwebsite.com
     * - **Authorized redirect URIs**: https://localhost:19006 & https://yourwebsite.com
     * - To test this be sure to start your app with `expo start:web --https`.
     */
    webClientId?: string;
    /**
     * iOS native client ID for use in standalone, bare workflow, and custom clients.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: iOS Application
     * - Give it a name (e.g. "iOS App").
     * - **Bundle ID**: Must match the value of `ios.bundleIdentifier` in your `app.json`.
     * - Your app needs to conform to the URI scheme matching your bundle identifier.
     *   - _Standalone_: Automatically added, do nothing.
     *   - _Bare workflow_: Run `npx uri-scheme add <your bundle id> --ios`
     * - To test this you can:
     *   1. Eject to bare: `expo eject` and run `yarn ios`
     *   2. Create a custom client: `expo client:ios`
     *   3. Build a production IPA: `expo build:ios`
     * - Whenever you change the values in `app.json` you'll need to rebuild the native app.
     */
    iosClientId?: string;
    /**
     * Android native client ID for use in standalone, and bare workflow.
     *
     * This Google Client ID must be setup as follows:
     *
     * - **Application Type**: Android Application
     * - Give it a name (e.g. "Android App").
     * - **Package name**: Must match the value of `android.package` in your `app.json`.
     * - Your app needs to conform to the URI scheme matching your `android.package` (ex. `com.myname.mycoolapp:/`).
     *   - _Standalone_: Automatically added, do nothing.
     *   - _Bare workflow_: Run `npx uri-scheme add <your android.package> --android`
     * - **Signing-certificate fingerprint**:
     *   - Run `expo credentials:manager -p android` then select "Update upload Keystore" -> "Generate new keystore" -> "Go back to experience overview"
     *   - Copy your "Google Certificate Fingerprint", it will output a string that looks like `A1:B2:C3` but longer.
     * - To test this you can:
     *   1. Eject to bare: `expo eject` and run `yarn ios`
     *   2. Build a production IPA: `expo build:android`
     */
    androidClientId?: string;
    /**
     * Should the hook automatically exchange the response code for an authentication token.
     *
     * Defaults to `true` on installed apps (iOS, Android) when `ResponseType.Code` is used (default).
     */
    shouldAutoExchangeCode?: boolean;
    /**
     * Language code ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
     */
    language?: string;
}
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