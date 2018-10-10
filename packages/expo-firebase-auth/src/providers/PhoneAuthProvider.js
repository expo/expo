/**
 * @flow
 * PhoneAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const providerId = 'phone';

export default class PhoneAuthProvider {
  constructor() {
    throw new Error('`new PhoneAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID(): string {
    return providerId;
  }

  static credential(verificationId: string, code: string): AuthCredential {
    return {
      token: verificationId,
      secret: code,
      providerId,
    };
  }
}
