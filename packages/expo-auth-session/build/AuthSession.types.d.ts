import { AuthError } from './Errors';
import { TokenResponse } from './TokenRequest';
/**
 * Object returned after an auth request has completed.
 * - If the user cancelled the authentication session by closing the browser, the result is `{ type: 'cancel' }`.
 * - If the authentication is dismissed manually with `AuthSession.dismiss()`, the result is `{ type: 'dismiss' }`.
 * - If the authentication flow is successful, the result is `{ type: 'success', params: Object, event: Object }`.
 * - If the authentication flow is returns an error, the result is `{ type: 'error', params: Object, error: string, event: Object }`.
 */
export type AuthSessionResult = {
    /**
     * How the auth completed.
     */
    type: 'cancel' | 'dismiss' | 'opened' | 'locked';
} | {
    /**
     * How the auth completed.
     */
    type: 'error' | 'success';
    /**
     * @deprecated Legacy error code query param, use `error` instead.
     */
    errorCode: string | null;
    /**
     * Possible error if the auth failed with type `error`.
     */
    error?: AuthError | null;
    /**
     * Query params from the `url` as an object.
     */
    params: Record<string, string>;
    /**
     * Returned when the auth finishes with an `access_token` property.
     */
    authentication: TokenResponse | null;
    /**
     * Auth URL that was opened
     */
    url: string;
};
/**
 * Options passed to `makeRedirectUri`.
 */
export type AuthSessionRedirectUriOptions = {
    /**
     * Optional path to append to a URI. This will not be added to `native`.
     */
    path?: string;
    /**
     * URI protocol `<scheme>://` that must be built into your native app.
     */
    scheme?: string;
    /**
     * Optional native scheme
     * URI protocol `<scheme>://` that must be built into your native app.
     */
    queryParams?: Record<string, string | undefined>;
    /**
     * Should the URI be triple slashed `scheme:///path` or double slashed `scheme://path`.
     * Defaults to `false`.
     */
    isTripleSlashed?: boolean;
    /**
     * Attempt to convert the Expo server IP address to localhost.
     * This is useful for testing when your IP changes often, this will only work for iOS simulator.
     *
     * @default false
     */
    preferLocalhost?: boolean;
    /**
     * Manual scheme to use in Bare and Standalone native app contexts. Takes precedence over all other properties.
     * You must define the URI scheme that will be used in a custom built native application or standalone Expo application.
     * The value should conform to your native app's URI schemes.
     * You can see conformance with `npx uri-scheme list`.
     */
    native?: string;
};
//# sourceMappingURL=AuthSession.types.d.ts.map