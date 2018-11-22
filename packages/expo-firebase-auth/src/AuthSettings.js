import { Platform } from 'expo-core';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// import type Auth from '.';
type Auth = object;
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
      this._auth.nativeModule.setAppVerificationDisabledForTesting(disabled);
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
      return this._auth.nativeModule.setAutoRetrievedSmsCodeForPhoneNumber(phoneNumber, smsCode);
    }

    return Promise.resolve(null);
  }
}
