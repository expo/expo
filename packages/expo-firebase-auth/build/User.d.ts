import { ActionCodeSettings, AuthCredential, NativeUser, UserCredential, UserInfo, UserMetadata, IdTokenResult } from './types';
declare type Auth = any;
declare type UpdateProfile = {
    displayName?: string;
    photoURL?: string;
};
export default class User {
    _auth: Auth;
    _user: NativeUser;
    /**
     *
     * @param auth Instance of Authentication class
     * @param user user result object from native
     */
    constructor(auth: Auth, user: NativeUser);
    /**
     * PROPERTIES
     */
    readonly displayName: string | null;
    readonly email: string | null;
    readonly emailVerified: boolean;
    readonly isAnonymous: boolean;
    readonly metadata: UserMetadata;
    readonly phoneNumber: string | null;
    readonly photoURL: string | null;
    readonly providerData: Array<UserInfo>;
    readonly providerId: string;
    readonly uid: string;
    /**
     * METHODS
     */
    /**
     * Delete the current user
     * @return {Promise}
     */
    delete(): Promise<User>;
    /**
     * Returns a JWT token used to identify the user to a Firebase service.
     *
     * @param forceRefresh boolean Force refresh regardless of token expiration.
     * @return {Promise<string>}
     */
    getIdToken(forceRefresh?: boolean): Promise<string>;
    /**
     * Returns a IdTokenResult object which contains the ID token JWT string and other properties for getting
     * data associated with the token and all the decoded payload claims.
     *
     * @param forceRefresh boolean Force refresh regardless of token expiration.
     * @return {Promise<IdTokenResult>}
     */
    getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult>;
    /**
     * @param credential
     */
    linkWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * @deprecated Deprecated linkAndRetrieveDataWithCredential in favor of linkWithCredential.
     * @param credential
     */
    linkAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * Re-authenticate a user with a third-party authentication provider
     * @return {Promise}         A promise resolved upon completion
     */
    reauthenticateWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * Re-authenticate a user with a third-party authentication provider
     *
     * @deprecated Deprecated reauthenticateAndRetrieveDataWithCredential in favor of reauthenticateWithCredential.
     * @return {Promise}         A promise resolved upon completion
     */
    reauthenticateAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * Reload the current user
     * @return {Promise}
     */
    reload(): Promise<User>;
    /**
     * Send verification email to current user.
     */
    sendEmailVerification(actionCodeSettings?: ActionCodeSettings): Promise<User>;
    toJSON(): {
        [key: string]: any;
    };
    /**
     *
     * @param providerId
     * @return {Promise.<TResult>|*}
     */
    unlink(providerId: string): Promise<User>;
    /**
     * Update the current user's email
     *
     * @param  {string} email The user's _new_ email
     * @return {Promise}       A promise resolved upon completion
     */
    updateEmail(email: string): Promise<void>;
    /**
     * Update the current user's password
     * @param  {string} password the new password
     * @return {Promise}
     */
    updatePassword(password: string): Promise<User>;
    /**
     * Update the current user's phone number
     *
     * @param  {AuthCredential} credential Auth credential with the _new_ phone number
     * @return {Promise}
     */
    updatePhoneNumber(credential: AuthCredential): Promise<User>;
    /**
     * Update the current user's profile
     * @param  {Object} updates An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
     * @return {Promise}
     */
    updateProfile(updates?: UpdateProfile): Promise<User>;
    /**
     * KNOWN UNSUPPORTED METHODS
     */
    linkWithPhoneNumber(): void;
    linkWithPopup(): void;
    linkWithRedirect(): void;
    reauthenticateWithPhoneNumber(): void;
    reauthenticateWithPopup(): void;
    reauthenticateWithRedirect(): void;
    readonly refreshToken: string;
}
export {};
