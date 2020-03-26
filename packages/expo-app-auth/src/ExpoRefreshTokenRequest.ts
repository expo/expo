import { GRANT_TYPE_REFRESH_TOKEN, StringMap } from '@openid/appauth';
import invariant from 'invariant';

import { ExpoTokenRequest } from './ExpoTokenRequest';

/**
 * Represents the Token Request as user-friendly JSON.
 */
export interface ExpoRefreshTokenRequestJson {
  code?: string;
  refreshToken?: string;
  redirectUri: string;
  clientId: string;
  extras?: StringMap;
  clientSecret?: string;
  scopes?: string[];
  codeVerifier?: string;
}

/**
 * Represents a refresh token request.
 * This is a utility class created for parity with `ExpoRevokeTokenRequest`.
 */
export class ExpoRefreshTokenRequest extends ExpoTokenRequest {
  constructor(options: ExpoRefreshTokenRequestJson) {
    invariant(
      options.refreshToken,
      `\`ExpoRefreshTokenRequest\` requires a valid \`refreshToken\`.`
    );
    super({
      grant_type: GRANT_TYPE_REFRESH_TOKEN,
      code: options.code,
      refresh_token: options.refreshToken,
      redirect_uri: options.redirectUri,
      client_id: options.clientId,
      extras: options.extras,
      client_secret: options.clientSecret,
      scope: Array.isArray(options.scopes) ? options.scopes.join(' ') : undefined,
      code_verifier: options.codeVerifier,
    });
  }
}
