import { AuthError } from './Errors';
import { TokenResponse } from './TokenRequest';
export declare type AuthSessionOptions = {
    authUrl: string;
    returnUrl?: string;
    showInRecents?: boolean;
};
export declare type AuthSessionResult = {
    type: 'cancel' | 'dismiss' | 'locked';
} | {
    type: 'error' | 'success';
    errorCode: string | null;
    error?: AuthError | null;
    params: {
        [key: string]: string;
    };
    authentication: TokenResponse | null;
    url: string;
};
/**
 * Options passed to `makeRedirectUriAsync`.
 */
export declare type AuthSessionRedirectUriOptions = {
    /**
     * Optional path to append to a URI. This will not be added to `native`.
     */
    path?: string;
    /**
     * URI protocol `<scheme>://` that must be built into your native app.
     * Passed to `Linking.createURL()` when `useProxy` is `false`.
     */
    scheme?: string;
    /**
     * Optional native scheme to use when proxy is disabled.
     * URI protocol `<scheme>://` that must be built into your native app.
     * Passed to `Linking.createURL()` when `useProxy` is `false`.
     */
    queryParams?: Record<string, string | undefined>;
    /**
     * Should the URI be triple slashed `scheme:///path` or double slashed `scheme://path`.
     * Defaults to `false`.
     * Passed to `Linking.createURL()` when `useProxy` is `false`.
     */
    isTripleSlashed?: boolean;
    /**
     * Should use the \`auth.expo.io\` proxy.
     * This is useful for testing managed native apps that require a custom URI scheme.
     *
     * @default false
     */
    useProxy?: boolean;
    /**
     * Attempt to convert the Expo server IP address to localhost.
     * This is useful for testing when your IP changes often, this will only work for iOS simulator.
     *
     * @default false
     */
    preferLocalhost?: boolean;
    /**
     * Manual scheme to use in Bare and Standalone native app contexts.
     * Takes precedence over all other properties.
     * You must define the URI scheme that will be used in a custom built native application or standalone Expo application.
     * The value should conform to your native app's URI schemes.
     * You can see conformance with:
     *
     * `npx uri-scheme list`
     *
     */
    native?: string;
};
