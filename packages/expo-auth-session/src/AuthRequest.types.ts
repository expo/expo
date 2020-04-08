export enum CodeChallengeMethod {
  S256 = 'S256',
  Plain = 'plain',
}

/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * https://tools.ietf.org/html/rfc6749#section-3.1.1
 */
export enum ResponseType {
  /**
   * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
   */
  Code = 'code',
  /**
   * for requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
   */
  Token = 'token',
}

export type AuthRequestPromptOptions = {
  url?: string;
  useProxy?: boolean;
  showInRecents?: boolean;
};

export interface AuthRequestConfig {
  responseType: ResponseType;
  clientId: string;
  /**
   * https://tools.ietf.org/html/rfc6749#section-3.1.2
   */
  redirectUri: string;
  scopes: string[];
  clientSecret?: string;
  codeChallengeMethod: CodeChallengeMethod;
  codeChallenge?: string;
  state?: string;
  extraParams?: Record<string, string>;
  usePKCE?: boolean;
}

export type AuthResult = {
  code: string;
  state: string;
};
