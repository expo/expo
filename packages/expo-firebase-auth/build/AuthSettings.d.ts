declare type Auth = any;
export default class AuthSettings {
    _auth: Auth;
    _appVerificationDisabledForTesting: boolean;
    constructor(auth: Auth);
    /**
     * Flag to determine whether app verification should be disabled for testing or not.
     *
     * @platform iOS
     * @return {boolean}
     */
    /**
    * Flag to determine whether app verification should be disabled for testing or not.
    *
    * @platform iOS
    * @param disabled
    */
    appVerificationDisabledForTesting: boolean;
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
    setAutoRetrievedSmsCodeForPhoneNumber(phoneNumber: string, smsCode: string): Promise<null>;
}
export {};
