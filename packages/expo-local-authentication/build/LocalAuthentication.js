import { UnavailabilityError } from '@unimodules/core';
import invariant from 'invariant';
import ExpoLocalAuthentication from './ExpoLocalAuthentication';
import { AuthenticationType, SecurityLevel, } from './LocalAuthentication.types';
export { AuthenticationType, SecurityLevel };
export async function hasHardwareAsync() {
    if (!ExpoLocalAuthentication.hasHardwareAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'hasHardwareAsync');
    }
    return await ExpoLocalAuthentication.hasHardwareAsync();
}
export async function supportedAuthenticationTypesAsync() {
    if (!ExpoLocalAuthentication.supportedAuthenticationTypesAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'supportedAuthenticationTypesAsync');
    }
    return await ExpoLocalAuthentication.supportedAuthenticationTypesAsync();
}
export async function isEnrolledAsync() {
    if (!ExpoLocalAuthentication.isEnrolledAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'isEnrolledAsync');
    }
    return await ExpoLocalAuthentication.isEnrolledAsync();
}
export async function getEnrolledLevelAsync() {
    if (!ExpoLocalAuthentication.getEnrolledLevelAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'getEnrolledLevelAsync');
    }
    return await ExpoLocalAuthentication.getEnrolledLevelAsync();
}
export async function authenticateAsync(options = {}) {
    if (!ExpoLocalAuthentication.authenticateAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'authenticateAsync');
    }
    if (options.hasOwnProperty('promptMessage')) {
        invariant(typeof options.promptMessage === 'string' && options.promptMessage.length, 'LocalAuthentication.authenticateAsync : `options.promptMessage` must be a non-empty string.');
    }
    const promptMessage = options.promptMessage || 'Authenticate';
    const result = await ExpoLocalAuthentication.authenticateAsync({ ...options, promptMessage });
    if (result.warning) {
        console.warn(result.warning);
    }
    return result;
}
export async function cancelAuthenticate() {
    if (!ExpoLocalAuthentication.cancelAuthenticate) {
        throw new UnavailabilityError('expo-local-authentication', 'cancelAuthenticate');
    }
    await ExpoLocalAuthentication.cancelAuthenticate();
}
//# sourceMappingURL=LocalAuthentication.js.map