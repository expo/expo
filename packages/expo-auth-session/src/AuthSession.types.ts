import { AuthError } from './Errors';
import { TokenResponse } from './TokenRequest';

// @needsAudit
export type AuthSessionOptions = {
  /**
   * The URL that points to the sign in page that you would like to open the user to.
   */
  authUrl: string;
  /**
   * The URL to return to the application. In managed apps, it's optional and defaults to output of [`Linking.createURL('expo-auth-session', params)`](./linking/#linkingcreateurlpath-namedparameters)
   * call with `scheme` and `queryParams` params. However, in the bare app, it's required - `AuthSession` needs to know where to wait for the response.
   * Hence, this method will throw an exception, if you don't provide `returnUrl`.
   */
  returnUrl?: string;
  /**
   * A boolean determining whether browsed website should be shown as separate entry in Android recents/multitasking view.
   * @default false
   * @platform android
   */
  showInRecents?: boolean;
  /**
   * Project name to use for the `auth.expo.io` proxy.
   */
  projectNameForProxy?: string;
};

// @needsAudit
/**
 * Object returned after an auth request has completed.
 * - If the user cancelled the authentication session by closing the browser, the result is `{ type: 'cancel' }`.
 * - If the authentication is dismissed manually with `AuthSession.dismiss()`, the result is `{ type: 'dismiss' }`.
 * - If the authentication flow is successful, the result is `{ type: 'success', params: Object, event: Object }`.
 * - If the authentication flow is returns an error, the result is `{ type: 'error', params: Object, error: string, event: Object }`.
 * - If you call `AuthSession.startAsync()` more than once before the first call has returned, the result is `{ type: 'locked' }`,
 *   because only one `AuthSession` can be in progress at any time.
 */
export type AuthSessionResult =
  | {
      /**
       * How the auth completed.
       */
      type: 'cancel' | 'dismiss' | 'opened' | 'locked';
    }
  | {
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

// @needsAudit
/**
 * Options passed to `makeRedirectUriAsync`.
 */
export type AuthSessionRedirectUriOptions = {
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
   * Project name to use for the `auth.expo.io` proxy when `useProxy` is `true`.
   */
  projectNameForProxy?: string;
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
