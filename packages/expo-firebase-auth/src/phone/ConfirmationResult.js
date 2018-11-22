/**
 * @flow
 * ConfirmationResult representation wrapper
 */
// import type Auth from '../';
import type User from '../User';
type Auth = object;

export default class ConfirmationResult {
  _auth: Auth;
  _verificationId: string;

  /**
   *
   * @param auth
   * @param verificationId The phone number authentication operation's verification ID.
   */
  constructor(auth: Auth, verificationId: string) {
    this._auth = auth;
    this._verificationId = verificationId;
  }

  /**
   *
   * @param verificationCode
   * @return {*}
   */
  confirm(verificationCode: string): Promise<User> {
    return this._auth.nativeModule
      ._confirmVerificationCode(verificationCode)
      .then(user => this._auth._setUser(user));
  }

  get verificationId(): string | null {
    return this._verificationId;
  }
}
