import { CodedError, EventEmitter, UnavailabilityError } from '@unimodules/core';
import { AppleAuthenticationOperation, } from './AppleAuthentication.types';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';
export async function isAvailableAsync() {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.isAvailableAsync) {
        return false;
    }
    return ExpoAppleAuthentication.isAvailableAsync();
}
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
        throw new CodedError('ERR_APPLE_AUTHENTICATION_REQUEST_FAILED', 'The credential returned by `signInAsync` is missing one or more required fields.');
    }
    return credential;
}
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
        throw new CodedError('ERR_APPLE_AUTHENTICATION_REQUEST_FAILED', 'The credential returned by `refreshAsync` is missing one or more required fields.');
    }
    return credential;
}
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
export async function getCredentialStateAsync(user) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
    }
    return ExpoAppleAuthentication.getCredentialStateAsync(user);
}
const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);
export function addRevokeListener(listener) {
    return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
//# sourceMappingURL=AppleAuthentication.js.map