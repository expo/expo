import { getNativeModule, utils } from 'expo-firebase-app';

const { isAndroid, isIOS } = utils;

import type Auth from '.';

export default class AuthSettings {
  _auth: Auth;

  _appVerificationDisabledForTesting: boolean;

  constructor(auth: Auth) {
    this._auth = auth;
    this._appVerificationDisabledForTesting = false;
  }

  /**
   * Flag to determine whether app verification should be disabled for testing or not.
   *
   * @platform iOS
   * @return {boolean}
   */
  get appVerificationDisabledForTesting(): boolean {
    return this._appVerificationDisabledForTesting;
  }

  /**
   * Flag to determine whether app verification should be disabled for testing or not.
   *
   * @platform iOS
   * @param disabled
   */
  set appVerificationDisabledForTesting(disabled: boolean) {
    if (isIOS) {
      this._appVerificationDisabledForTesting = disabled;
      getNativeModule(this._auth).setAppVerificationDisabledForTesting(disabled);
    }
  }

  /**
   * The phone number and SMS code here must have been configured in the
   * Firebase Console (Authentication > Sign In Method > Phone).
   *
   * Calling this method a second time will overwrite the previously passed parameters.
   * Only one number can be configured at a given time.
   *
   * @platform Android
   * @param phoneNumber
   * @param smsCode
   * @return {*}
   */
  setAutoRetrievedSmsCodeForPhoneNumber(phoneNumber: string, smsCode: string): Promise<null> {
    if (isAndroid) {
      return getNativeModule(this._auth).setAutoRetrievedSmsCodeForPhoneNumber(
        phoneNumber,
        smsCode
      );
    }

    return Promise.resolve(null);
  }
}
