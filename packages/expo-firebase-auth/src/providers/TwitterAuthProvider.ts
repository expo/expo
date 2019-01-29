/**
 * @flow
 * TwitterAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const providerId = 'twitter.com';

export default class TwitterAuthProvider {
  constructor() {
    throw new Error('`new TwitterAuthProvider()` is not supported on the native Firebase SDKs.');
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
