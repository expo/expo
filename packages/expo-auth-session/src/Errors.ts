import { CodedError } from '@unimodules/core';

export interface ResponseErrorConfig extends Record<string, any> {
  /**
   * Error code
   */
  error: string;
  /**
   * Additional message
   */
  error_description?: string;
  /**
   * URI for more info on the error
   */
  error_uri?: string;
}

export interface AuthResponseErrorConfig extends ResponseErrorConfig {
  /**
   * Required only if state is used in the initial request
   */
  state?: string;
}

const errorCodeMessages = {
  // https://tools.ietf.org/html/rfc6749#section-4.1.2.1
  auth: {
    invalid_request: `The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.`,
    unauthorized_client: `The client is not authorized to request an authorization code using this method.`,
    access_denied: `The resource owner or authorization server denied the request.`,
    unsupported_response_type: `The authorization server does not support obtaining an authorization code using this method.`,
    invalid_scope: 'The requested scope is invalid, unknown, or malformed.',
    server_error:
      'The authorization server encountered an unexpected condition that prevented it from fulfilling the request. (This error code is needed because a 500 Internal Server Error HTTP status code cannot be returned to the client via an HTTP redirect.)',
    temporarily_unavailable:
      'The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server.  (This error code is needed because a 503 Service Unavailable HTTP status code cannot be returned to the client via an HTTP redirect.)',
  },
  // https://tools.ietf.org/html/rfc6749#section-5.2
  token: {
    invalid_request: `The request is missing a required parameter, includes an unsupported parameter value (other than grant type), repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client, or is otherwise malformed.`,
    invalid_client: `Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).  The authorization server MAY return an HTTP 401 (Unauthorized) status code to indicate which HTTP authentication schemes are supported.  If the client attempted to authenticate via the "Authorization" request header field, the authorization server MUST respond with an HTTP 401 (Unauthorized) status code and include the "WWW-Authenticate" response header field matching the authentication scheme used by the client.`,
    invalid_grant: `The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.`,
    unauthorized_client: `The authenticated client is not authorized to use this authorization grant type.`,
    unsupported_grant_type: `The authorization grant type is not supported by the authorization server.`,
  },
};

/**
 * Extends https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */
export class ResponseError extends CodedError {
  /**
   * Used to assist the client developer in
   * understanding the error that occurred.
   */
  description?: string;
  /**
   * A URI identifying a human-readable web page with
   * information about the error, used to provide the client
   * developer with additional information about the error.
   */
  uri?: string;
  /**
   * Raw results of the error.
   */
  params: Record<string, string>;

  constructor(params: ResponseErrorConfig, errorCodeType: string) {
    const { error, error_description, error_uri } = params;
    const message = errorCodeMessages[errorCodeType][error];
    let errorMessage: string;
    if (message) {
      errorMessage = message + error_description ? `\nMore info: ${error_description}` : '';
    } else if (error_description) {
      errorMessage = error_description;
    } else {
      errorMessage = 'An unknown error occurred';
    }
    super(error, errorMessage);
    this.description = error_description;
    this.uri = error_uri;
    this.params = params;
  }
}

/**
 * Extends https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */
export class TokenResponseError extends ResponseError {
  constructor(response: ResponseErrorConfig) {
    super(response, 'token');
  }
}

/**
 * Extends https://tools.ietf.org/html/rfc6749#section-5.2
 */
export class AuthResponseError extends ResponseError {
  /**
   * Required only if state is used in the initial request
   */
  state?: string;

  constructor(response: AuthResponseErrorConfig) {
    super(response, 'auth');
    this.state = response.state;
  }
}
