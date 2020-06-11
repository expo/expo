import { WebBrowserOpenOptions, WebBrowserWindowFeatures } from 'expo-web-browser';

export enum CodeChallengeMethod {
  /**
   * The default and recommended method for transforming the code verifier.
   * 1. Convert the code verifier to ASCII.
   * 2. Create a digest of the string using crypto method SHA256.
   * 3. Convert the digest to Base64 and URL encode it.
   */
  S256 = 'S256',
  /**
   * This should not be used.
   * When used, the code verifier will be sent to the server as-is.
   */
  Plain = 'plain',
}

/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * [Section 3.1.1](https://tools.ietf.org/html/rfc6749#section-3.1.1)
 */
export enum ResponseType {
  /**
   * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
   */
  Code = 'code',
  /**
   * For requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
   */
  Token = 'token',
  /**
   * A custom registered type for getting an `id_token` from Google OAuth.
   */
  IdToken = 'id_token',
}

/**
 * Should the user be prompted to login or consent again.
 * This can be used to present a dialog for switching accounts after the user has already been logged in.
 *
 * [Section 3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationRequest)
 */
export enum Prompt {
  /**
   * Server must not display any auth or consent UI. Can be used to check for existing auth or consent.
   * An error is returned if a user isn't already authenticated or the client doesn't have pre-configured consent for the requested claims, or does not fulfill other conditions for processing the request.
   * The error code will typically be `login_required`, `interaction_required`, or another code defined in [Section 3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError).
   */
  None = 'none',
  /**
   * The server should prompt the user to reauthenticate.
   * If it cannot reauthenticate the End-User, it must return an error, typically `login_required`.
   */
  Login = 'login',
  /**
   * Server should prompt the user for consent before returning information to the client.
   * If it cannot obtain consent, it must return an error, typically `consent_required`.
   */
  Consent = 'consent',
  /**
   * Server should prompt the user to select an account. Can be used to switch accounts.
   * If it can't obtain an account selection choice made by the user, it must return an error, typically `account_selection_required`.
   */
  SelectAccount = 'select_account',
}

/**
 * Options for the prompt window / web browser.
 * This can be used to configure how the web browser should look and behave.
 */
export type AuthRequestPromptOptions = Omit<WebBrowserOpenOptions, 'windowFeatures'> & {
  /**
   * URL to open when prompting the user. This should be defined internally.
   */
  url?: string;
  /**
   * Should the authentication request use the Expo proxy service `auth.expo.io`.
   * Default: `false`.
   */
  useProxy?: boolean;
  /**
   * **Web:** features to use with `window.open()`
   */
  windowFeatures?: WebBrowserWindowFeatures;
};

/**
 * Represents an OAuth authorization request as JSON.
 */
export interface AuthRequestConfig {
  /**
   * Specifies what is returned from the authorization server.
   *
   * [Section 3.1.1](https://tools.ietf.org/html/rfc6749#section-3.1.1)
   *
   * @default ResponseType.Code
   */
  responseType?: ResponseType | string;
  /**
   * A unique string representing the registration information provided by the client.
   * The client identifier is not a secret; it is exposed to the resource owner and shouldn't be used
   * alone for client authentication.
   *
   * The client identifier is unique to the authorization server.
   *
   * [Section 2.2](https://tools.ietf.org/html/rfc6749#section-2.2)
   */
  clientId: string;
  /**
   * After completing an interaction with a resource owner the
   * server will redirect to this URI. Learn more about [linking in Expo](https://docs.expo.io/versions/latest/workflow/linking/).
   *
   * [Section 3.1.2](https://tools.ietf.org/html/rfc6749#section-3.1.2)
   */
  redirectUri: string;
  /**
   * List of strings to request access to.
   *
   * [Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)
   */
  scopes: string[];
  /**
   * Client secret supplied by an auth provider.
   * There is no secure way to store this on the client.
   *
   * [Section 2.3.1](https://tools.ietf.org/html/rfc6749#section-2.3.1)
   */
  clientSecret?: string;
  /**
   * Method used to generate the code challenge.
   * Defaults to `S256`. You should never use `Plain` as it's not good enough for secure verification.
   */
  codeChallengeMethod?: CodeChallengeMethod;
  /**
   * Derived from the code verifier by using the `CodeChallengeMethod`.
   *
   * [Section 4.2](https://tools.ietf.org/html/rfc7636#section-4.2)
   */
  codeChallenge?: string;
  /**
   * Informs the server if the user should be prompted to login or consent again.
   * This can be used to present a dialog for switching accounts after the user has already been logged in.
   *
   * [Section 3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationRequest)
   */
  prompt?: Prompt;
  /**
   * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
   */
  state?: string;
  /**
   * Extra query params that'll be added to the query string.
   */
  extraParams?: Record<string, string>;
  /**
   * Should use [Proof Key for Code Exchange](https://oauth.net/2/pkce/).
   * Defaults to true.
   */
  usePKCE?: boolean;
}
