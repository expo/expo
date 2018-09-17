/**
 * @flow
 * EmailAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const providerId = 'google.com';

export default class GoogleAuthProvider {
  constructor() {
    throw new Error('`new GoogleAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID(): string {
    return providerId;
  }

  static credential(token: string, secret: string): AuthCredential {
    return {
      token,
      secret,
      providerId,
    };
  }
}
