import { App, ModuleBase } from 'expo-firebase-app';
import ConfirmationResult from './phone/ConfirmationResult';
import PhoneAuthListener from './phone/PhoneAuthListener';
import EmailAuthProvider from './providers/EmailAuthProvider';
import FacebookAuthProvider from './providers/FacebookAuthProvider';
import GithubAuthProvider from './providers/GithubAuthProvider';
import GoogleAuthProvider from './providers/GoogleAuthProvider';
import OAuthProvider from './providers/OAuthProvider';
import PhoneAuthProvider from './providers/PhoneAuthProvider';
import TwitterAuthProvider from './providers/TwitterAuthProvider';
import User from './User';
import AuthSettings from './AuthSettings';
import { ActionCodeInfo, ActionCodeSettings, AuthCredential, NativeUser, NativeUserCredential, UserCredential } from './types';
export declare const MODULE_NAME = "ExpoFirebaseAuth";
export declare const NAMESPACE = "auth";
export declare const statics: {
    EmailAuthProvider: typeof EmailAuthProvider;
    PhoneAuthProvider: typeof PhoneAuthProvider;
    GoogleAuthProvider: typeof GoogleAuthProvider;
    GithubAuthProvider: typeof GithubAuthProvider;
    TwitterAuthProvider: typeof TwitterAuthProvider;
    FacebookAuthProvider: typeof FacebookAuthProvider;
    OAuthProvider: typeof OAuthProvider;
    PhoneAuthState: {
        CODE_SENT: string;
        AUTO_VERIFY_TIMEOUT: string;
        AUTO_VERIFIED: string;
        ERROR: string;
    };
};
export default class Auth extends ModuleBase {
    static namespace: string;
    static moduleName: string;
    static statics: {
        EmailAuthProvider: typeof EmailAuthProvider;
        PhoneAuthProvider: typeof PhoneAuthProvider;
        GoogleAuthProvider: typeof GoogleAuthProvider;
        GithubAuthProvider: typeof GithubAuthProvider;
        TwitterAuthProvider: typeof TwitterAuthProvider;
        FacebookAuthProvider: typeof FacebookAuthProvider;
        OAuthProvider: typeof OAuthProvider;
        PhoneAuthState: {
            CODE_SENT: string;
            AUTO_VERIFY_TIMEOUT: string;
            AUTO_VERIFIED: string;
            ERROR: string;
        };
    };
    _authResult: boolean;
    _languageCode: string;
    _user: User | null;
    constructor(app: App);
    _setUser(user?: NativeUser): User | null;
    _setUserCredential(userCredential: NativeUserCredential): UserCredential;
    /**
     * Listen for auth changes.
     * @param listener
     */
    onAuthStateChanged(listener: Function): () => void;
    /**
     * Listen for id token changes.
     * @param listener
     */
    onIdTokenChanged(listener: Function): () => void;
    /**
     * Listen for user changes.
     * @param listener
     */
    onUserChanged(listener: Function): () => void;
    /**
     * Sign the current user out
     * @return {Promise}
     */
    signOut(): Promise<void>;
    /**
     * Sign a user in anonymously
     *
     * @return {Promise} A promise resolved upon completion
     */
    signInAnonymously(): Promise<UserCredential>;
    /**
     * Sign a user in anonymously
     *
     * @deprecated Deprecated signInAnonymouslyAndRetrieveData in favor of signInAnonymously.
     * @return {Promise} A promise resolved upon completion
     */
    signInAnonymouslyAndRetrieveData(): Promise<UserCredential>;
    /**
     * Create a user with the email/password functionality
     *
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise indicating the completion
     */
    createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
    /**
     * Create a user with the email/password functionality
     *
     * @deprecated Deprecated createUserAndRetrieveDataWithEmailAndPassword in favor of createUserWithEmailAndPassword.
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise indicating the completion
     */
    createUserAndRetrieveDataWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
    /**
     * Sign a user in with email/password
     *
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise that is resolved upon completion
     */
    signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
    /**
     * Sign a user in with email/password
     *
     * @deprecated Deprecated signInAndRetrieveDataWithEmailAndPassword in favor of signInWithEmailAndPassword
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise that is resolved upon completion
     */
    signInAndRetrieveDataWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
    /**
     * Sign the user in with a custom auth token
     *
     * @param  {string} customToken  A self-signed custom auth token.
     * @return {Promise}             A promise resolved upon completion
     */
    signInWithCustomToken(customToken: string): Promise<UserCredential>;
    /**
     * Sign the user in with a custom auth token
     *
     * @deprecated Deprecated signInAndRetrieveDataWithCustomToken in favor of signInWithCustomToken
     * @param  {string} customToken  A self-signed custom auth token.
     * @return {Promise}             A promise resolved upon completion
     */
    signInAndRetrieveDataWithCustomToken(customToken: string): Promise<UserCredential>;
    /**
     * Sign the user in with a third-party authentication provider
     *
     * @return {Promise}           A promise resolved upon completion
     */
    signInWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * Sign the user in with a third-party authentication provider
     *
     * @deprecated Deprecated signInAndRetrieveDataWithCredential in favor of signInWithCredential.
     * @return {Promise}           A promise resolved upon completion
     */
    signInAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential>;
    /**
     * Asynchronously signs in using a phone number.
     *
     */
    signInWithPhoneNumber(phoneNumber: string, forceResend?: boolean): Promise<ConfirmationResult>;
    /**
     * Returns a PhoneAuthListener to listen to phone verification events,
     * on the final completion event a PhoneAuthCredential can be generated for
     * authentication purposes.
     *
     * @param phoneNumber
     * @param autoVerifyTimeoutOrForceResend Android Only
     * @param forceResend Android Only
     * @returns {PhoneAuthListener}
     */
    verifyPhoneNumber(phoneNumber: string, autoVerifyTimeoutOrForceResend?: number | boolean, forceResend?: boolean): PhoneAuthListener;
    /**
     * Send reset password instructions via email
     * @param {string} email The email to send password reset instructions
     * @param actionCodeSettings
     */
    sendPasswordResetEmail(email: string, actionCodeSettings?: ActionCodeSettings): Promise<void>;
    /**
     * Sends a sign-in email link to the user with the specified email
     * @param {string} email The email account to sign in with.
     * @param actionCodeSettings
     */
    sendSignInLinkToEmail(email: string, actionCodeSettings?: ActionCodeSettings): Promise<void>;
    /**
     * Checks if an incoming link is a sign-in with email link.
     * @param {string} emailLink Sign-in email link.
     */
    isSignInWithEmailLink(emailLink: string): boolean;
    /**
     * Asynchronously signs in using an email and sign-in email link.
     *
     * @param {string} email The email account to sign in with.
     * @param {string} emailLink Sign-in email link.
     * @return {Promise} A promise resolved upon completion
     */
    signInWithEmailLink(email: string, emailLink: string): Promise<UserCredential>;
    /**
     * Completes the password reset process, given a confirmation code and new password.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#confirmPasswordReset
     * @param code
     * @param newPassword
     * @return {Promise.<Null>}
     */
    confirmPasswordReset(code: string, newPassword: string): Promise<void>;
    /**
     * Applies a verification code sent to the user by email or other out-of-band mechanism.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#applyActionCode
     * @param code
     * @return {Promise.<Null>}
     */
    applyActionCode(code: string): Promise<void>;
    /**
     * Checks a verification code sent to the user by email or other out-of-band mechanism.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#checkActionCode
     * @param code
     * @return {Promise.<any>|Promise<ActionCodeInfo>}
     */
    checkActionCode(code: string): Promise<ActionCodeInfo>;
    /**
     * Returns a list of authentication methods that can be used to sign in a given user (identified by its main email address).
     * @return {Promise}
     */
    fetchSignInMethodsForEmail(email: string): Promise<string[]>;
    verifyPasswordResetCode(code: string): Promise<string>;
    /**
     * Sets the language for the auth module.
     *
     * @param code
     */
    /**
    * The language for the auth module.
    *
    * @return {string}
    */
    languageCode: string;
    /**
     * The current Auth instance's settings. This is used to edit/read configuration
     * related options like app verification mode for phone authentication.
     *
     * @return {AuthSettings}
     */
    _settings?: AuthSettings;
    readonly settings: AuthSettings;
    /**
     * Get the currently signed in user
     * @return {Promise}
     */
    readonly currentUser: User | null;
    /**
     * KNOWN UNSUPPORTED METHODS
     */
    getRedirectResult(): void;
    setPersistence(): void;
    signInWithPopup(): void;
    signInWithRedirect(): void;
    useDeviceLanguage(): void;
}
export { User, AuthSettings };
