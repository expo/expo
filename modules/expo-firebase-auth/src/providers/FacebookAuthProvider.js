/**
 * @flow
 * FacebookAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const providerId = 'facebook.com';

export default class FacebookAuthProvider {
  constructor() {
    throw new Error('`new FacebookAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID(): string {
    return providerId;
  }

  static credential(token: string): AuthCredential {
    return {
      token,
      secret: '',
      providerId,
    };
  }
}
