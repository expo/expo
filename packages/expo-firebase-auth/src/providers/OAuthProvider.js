/**
 * @flow
 * OAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const providerId = 'oauth';

export default class OAuthProvider {
  constructor() {
    throw new Error('`new OAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID(): string {
    return providerId;
  }

  static credential(idToken: string, accessToken: string): AuthCredential {
    return {
      token: idToken,
      secret: accessToken,
      providerId,
    };
  }
}
