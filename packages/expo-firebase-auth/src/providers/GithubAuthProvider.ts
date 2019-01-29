/**
 * @flow
 * GithubAuthProvider representation wrapper
 */
import invariant from 'invariant';
import type { AuthCredential } from '../types';

const providerId = 'github.com';

export default class GithubAuthProvider {
  constructor() {
    throw new Error('`new GithubAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID(): string {
    return providerId;
  }

  static credential(token: string): AuthCredential {
    invariant(token, 'credential failed: expected 1 argument (the OAuth access token).');
    return {
      token,
      secret: '',
      providerId,
    };
  }
}
