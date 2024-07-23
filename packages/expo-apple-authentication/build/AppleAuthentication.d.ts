import { EventSubscription } from 'expo-modules-core';
import { AppleAuthenticationCredential, AppleAuthenticationCredentialState, AppleAuthenticationRefreshOptions, AppleAuthenticationSignInOptions, AppleAuthenticationSignOutOptions } from './AppleAuthentication.types';
/**
 * Determine if the current device's operating system supports Apple authentication.
 * @return A promise that fulfills with `true` if the system supports Apple authentication, and `false` otherwise.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Sends a request to the operating system to initiate the Apple authentication flow, which will
 * present a modal to the user over your app and allow them to sign in.
 *
 * You can request access to the user's full name and email address in this method, which allows you
 * to personalize your UI for signed in users. However, users can deny access to either or both
 * of these options at runtime.
 *
 * Additionally, you will only receive Apple Authentication Credentials the first time users sign
 * into your app, so you must store it for later use. It's best to store this information either
 * server-side, or using [SecureStore](./securestore), so that the data persists across app installs.
 * You can use [`AppleAuthenticationCredential.user`](#appleauthenticationcredential) to identify
 * the user, since this remains the same for apps released by the same developer.
 *
 * @param options An optional [`AppleAuthenticationSignInOptions`](#appleauthenticationsigninoptions) object
 * @return A promise that fulfills with an [`AppleAuthenticationCredential`](#appleauthenticationcredential)
 * object after a successful authentication, and rejects with `ERR_REQUEST_CANCELED` if the user cancels the
 * sign-in operation.
 */
export declare function signInAsync(options?: AppleAuthenticationSignInOptions): Promise<AppleAuthenticationCredential>;
/**
 * An operation that refreshes the logged-in user’s credentials.
 * Calling this method will show the sign in modal before actually refreshing the user credentials.
 *
 * @param options An [`AppleAuthenticationRefreshOptions`](#appleauthenticationrefreshoptions) object
 * @returns A promise that fulfills with an [`AppleAuthenticationCredential`](#appleauthenticationcredential)
 * object after a successful authentication, and rejects with `ERR_REQUEST_CANCELED` if the user cancels the
 * refresh operation.
 */
export declare function refreshAsync(options: AppleAuthenticationRefreshOptions): Promise<AppleAuthenticationCredential>;
/**
 * An operation that ends the authenticated session.
 * Calling this method will show the sign in modal before actually signing the user out.
 *
 * It is not recommended to use this method to sign out the user as it works counterintuitively.
 * Instead of using this method it is recommended to simply clear all the user's data collected
 * from using [`signInAsync`](./#signinasync) or [`refreshAsync`](./#refreshasync) methods.
 *
 * @param options An [`AppleAuthenticationSignOutOptions`](#appleauthenticationsignoutoptions) object
 * @returns A promise that fulfills with an [`AppleAuthenticationCredential`](#appleauthenticationcredential)
 * object after a successful authentication, and rejects with `ERR_REQUEST_CANCELED` if the user cancels the
 * sign-out operation.
 */
export declare function signOutAsync(options: AppleAuthenticationSignOutOptions): Promise<AppleAuthenticationCredential>;
/**
 * Queries the current state of a user credential, to determine if it is still valid or if it has been revoked.
 * > **Note:** This method must be tested on a real device. On the iOS simulator it always throws an error.
 *
 * @param user The unique identifier for the user whose credential state you'd like to check.
 * This should come from the user field of an [`AppleAuthenticationCredential`](#appleauthenticationcredentialstate) object.
 * @return A promise that fulfills with an [`AppleAuthenticationCredentialState`](#appleauthenticationcredentialstate)
 * value depending on the state of the credential.
 */
export declare function getCredentialStateAsync(user: string): Promise<AppleAuthenticationCredentialState>;
export declare function addRevokeListener(listener: () => void): EventSubscription;
export { EventSubscription as Subscription };
//# sourceMappingURL=AppleAuthentication.d.ts.map