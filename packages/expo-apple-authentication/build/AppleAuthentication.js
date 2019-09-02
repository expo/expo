import { EventEmitter, UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';
import { AppleAuthenticationOperation, } from './AppleAuthentication.types';
/**
 * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
 * Generally users need to be on iOS 13+.
 */
export async function isAvailableAsync() {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.isAvailableAsync) {
        return false;
    }
    return ExpoAppleAuthentication.isAvailableAsync();
}
/**
 * Perform a Sign In with Apple request with the given `AppleAuthenticationLoginOptions`.
 * The method will return a Promise which will resolve to a `AppleAuthenticationCredential` on success.
 * You should make sure you include error handling.
 */
export async function loginAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'loginAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.LOGIN,
    };
    return ExpoAppleAuthentication.requestAsync(requestOptions);
}
export async function refreshAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'refreshAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.REFRESH,
    };
    return ExpoAppleAuthentication.requestAsync(requestOptions);
}
export async function logoutAsync(options) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.requestAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'logoutAsync');
    }
    const requestOptions = {
        ...options,
        requestedOperation: AppleAuthenticationOperation.LOGOUT,
    };
    return ExpoAppleAuthentication.requestAsync(requestOptions);
}
/**
 * You can query the current state of a user ID.
 * It will tell you if the token is still valid or if it has been revoked by the user.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/3175423-getcredentialstateforuserid) for more details.
 */
export async function getCredentialStateAsync(userId) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
    }
    return ExpoAppleAuthentication.getCredentialStateAsync(userId);
}
const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);
/**
 * Adds a listener for when a token has been revoked.
 * This means that the user has signed out and you should update your UI to reflect this
 */
export function addRevokeListener(listener) {
    return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
//# sourceMappingURL=AppleAuthentication.js.map