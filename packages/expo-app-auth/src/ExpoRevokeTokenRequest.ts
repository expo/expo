import { RevokeTokenRequest, TokenTypeHint } from '@openid/appauth';

/**
 * Represents the Token Request as user-friendly JSON.
 */
export interface ExpoRevokeTokenRequestJson {
  token: string;
  tokenTypeHint?: TokenTypeHint;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Represents a revoke token request.
 * For more information look at:
 * https://tools.ietf.org/html/rfc7009#section-2.1
 */
export class ExpoRevokeTokenRequest extends RevokeTokenRequest {
  constructor(options: ExpoRevokeTokenRequestJson) {
    super({
      token: options.token,
      token_type_hint: options.tokenTypeHint,
      client_id: options.clientId,
      client_secret: options.clientSecret,
    });
  }
}
