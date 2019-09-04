import { EventEmitter, UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';
import { AppleAuthenticationOperation, } from './AppleAuthentication.types';
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
export async function getCredentialStateAsync(userId) {
    if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.getCredentialStateAsync) {
        throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
    }
    return ExpoAppleAuthentication.getCredentialStateAsync(userId);
}
const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);
export function addRevokeListener(listener) {
    return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
//# sourceMappingURL=AppleAuthentication.js.map