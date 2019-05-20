import { UnavailabilityError } from '@unimodules/core';
import invariant from 'invariant';
import { Platform } from 'react-native';
import ExpoLocalAuthentication from './ExpoLocalAuthentication';
import { AuthenticationType } from './LocalAuthentication.types';
export { AuthenticationType };
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
export async function authenticateAsync(promptMessageIOS = 'Authenticate') {
    if (!ExpoLocalAuthentication.authenticateAsync) {
        throw new UnavailabilityError('expo-local-authentication', 'authenticateAsync');
    }
    if (Platform.OS === 'ios') {
        invariant(typeof promptMessageIOS === 'string' && promptMessageIOS.length, 'LocalAuthentication.authenticateAsync must be called with a non-empty string on iOS');
        const result = await ExpoLocalAuthentication.authenticateAsync(promptMessageIOS);
        if (result.warning) {
            console.warn(result.warning);
        }
        return result;
    }
    else {
        return await ExpoLocalAuthentication.authenticateAsync();
    }
}
export async function cancelAuthenticate() {
    if (!ExpoLocalAuthentication.cancelAuthenticate) {
        throw new UnavailabilityError('expo-local-authentication', 'cancelAuthenticate');
    }
    await ExpoLocalAuthentication.cancelAuthenticate();
}
//# sourceMappingURL=LocalAuthentication.js.map