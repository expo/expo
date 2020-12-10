import { AuthError } from './Errors';
import { TokenResponse } from './TokenRequest';

export type AuthSessionOptions = {
  authUrl: string;
  returnUrl?: string;
  showInRecents?: boolean;
};

export type AuthSessionResult =
  | { type: 'cancel' | 'dismiss' | 'locked' }
  | {
      type: 'error' | 'success';
      errorCode: string | null;
      error?: AuthError | null;
      params: { [key: string]: string };
      authentication: TokenResponse | null;
      url: string;
    };

/**
 * Options passed to `makeRedirectUriAsync`.
 */
export type AuthSessionRedirectUriOptions = {
  /**
   * You must define the URI scheme that will be used in a custom built native application or standalone Expo application.
   * The value should conform to your native app's URI schemes.
   * You can see conformance with:
   *
   * `npx uri-scheme list`
   *
   */
  native?: string;
  /**
   * Optional path to append to a URI. This will not be added to `native`.
   */
  path?: string;
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
};
