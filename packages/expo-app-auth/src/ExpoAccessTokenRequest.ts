import { GRANT_TYPE_AUTHORIZATION_CODE, StringMap } from '@openid/appauth';
import invariant from 'invariant';
import { Platform } from 'react-native';

import { ExpoTokenRequest } from './ExpoTokenRequest';

/**
 * Represents the Token Request as user-friendly JSON.
 */
export interface ExpoAccessTokenRequestJson {
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
 * Represents an access token request.
 * This is a utility class created for parity with `ExpoRevokeTokenRequest`.
 */
export class ExpoAccessTokenRequest extends ExpoTokenRequest {
  constructor(options: ExpoAccessTokenRequestJson) {
    invariant(
      options.redirectUri,
      `\`ExpoAccessTokenRequest\` requires a valid \`redirectUri\`. Example: ${Platform.select({
        web: 'https://yourwebsite.com/',
        default: 'com.your.app:/oauthredirect',
      })}`
    );
    super({
      grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
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
