import { CodedError, UnavailabilityError } from 'expo-modules-core';
import { AppleAuthenticationOperation, } from './AppleAuthentication.types';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';
// @needsAudit
/**
 * Determine if the current device's operating system supports Apple authentication.
 * @return A promise that fulfills with `true` if the system supports Apple authentication, and `false` otherwise.
 */
export async function isAvailableAsync() {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.isAvailableAsync) {
        return false;
    }
    return ExpoAppleAuthentication.isAvailableAsync();
}
// @needsAudit
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
export async function signInAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'signInAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.LOGIN,
    };
    const credential = await ExpoAppleAuthentication.requestAsync(requestOptions);
    if (!credential.authorizationCode || !credential.identityToken || !credential.user) {
        throw new CodedError('ERR_REQUEST_FAILED', 'The credential returned by `signInAsync` is missing one or more required fields.');
    }
    return credential;
}
// @needsAudit
/**
 * An operation that refreshes the logged-in user’s credentials.
 * Calling this method will show the sign in modal before actually refreshing the user credentials.
 *
 * @param options An [`AppleAuthenticationRefreshOptions`](#appleauthenticationrefreshoptions) object
 * @returns A promise that fulfills with an [`AppleAuthenticationCredential`](#appleauthenticationcredential)
 * object after a successful authentication, and rejects with `ERR_REQUEST_CANCELED` if the user cancels the
 * refresh operation.
 */
export async function refreshAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'refreshAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.REFRESH,
    };
    const credential = await ExpoAppleAuthentication.requestAsync(requestOptions);
    if (!credential.authorizationCode || !credential.identityToken || !credential.user) {
        throw new CodedError('ERR_REQUEST_FAILED', 'The credential returned by `refreshAsync` is missing one or more required fields.');
    }
    return credential;
}
// @needsAudit
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
export async function signOutAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'signOutAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.LOGOUT,
    };
    return ExpoAppleAuthentication.requestAsync(requestOptions);
}
// @needsAudit
/**
 * Queries the current state of a user credential, to determine if it is still valid or if it has been revoked.
 * > **Note:** This method must be tested on a real device. On the iOS simulator it always throws an error.
 *
 * @param user The unique identifier for the user whose credential state you'd like to check.
 * This should come from the user field of an [`AppleAuthenticationCredential`](#appleauthenticationcredentialstate) object.
 * @return A promise that fulfills with an [`AppleAuthenticationCredentialState`](#appleauthenticationcredentialstate)
 * value depending on the state of the credential.
 */
export async function getCredentialStateAsync(user) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
    }
    return ExpoAppleAuthentication.getCredentialStateAsync(user);
}
// @needsAudit @docsMissing
/**
 * Creates a locale-aware string representation of a person's name from an object representing the tokenized portions of a user's full name
 *
 * @param fullName The full name object with the tokenized portions
 * @param formatStyle The style in which the name should be formatted
 * @returns A locale-aware string representation of a person's name
 */
export function formatFullName(fullName, formatStyle) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.formatFullName) {
        throw new UnavailabilityError('expo-apple-authentication', 'formatFullName');
    }
    return ExpoAppleAuthentication.formatFullName(fullName, formatStyle);
}
// @docsMissing
export function addRevokeListener(listener) {
    return ExpoAppleAuthentication.addListener('Expo.appleIdCredentialRevoked', listener);
}
//# sourceMappingURL=AppleAuthentication.js.map