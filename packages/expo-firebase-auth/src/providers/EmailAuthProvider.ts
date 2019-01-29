/**
 * @flow
 * EmailAuthProvider representation wrapper
 */
import type { AuthCredential } from '../types';

const linkProviderId = 'emailLink';
const passwordProviderId = 'password';

export default class EmailAuthProvider {
  constructor() {
    throw new Error('`new EmailAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get EMAIL_LINK_SIGN_IN_METHOD(): string {
    return linkProviderId;
  }

  static get EMAIL_PASSWORD_SIGN_IN_METHOD(): string {
    return passwordProviderId;
  }

  static get PROVIDER_ID(): string {
    return passwordProviderId;
  }

  static credential(email: string, password: string): AuthCredential {
    return {
      token: email,
      secret: password,
      providerId: passwordProviderId,
    };
  }

  /**
   * Initialize an EmailAuthProvider credential using an email and an email link after a sign in with email link operation.
   * @param email Email address.
   * @param emailLink Sign-in email link.
   * @returns {{token: string, secret: string, providerId: string}}
   */
  static credentialWithLink(email: string, emailLink: string): AuthCredential {
    return {
      token: email,
      secret: emailLink,
      providerId: linkProviderId,
    };
  }
}
