import { UnavailabilityError } from '@unimodules/core';
import ExponentFacebook from './ExponentFacebook';
export async function logInWithReadPermissionsAsync(appId, options) {
    if (!ExponentFacebook.logInWithReadPermissionsAsync) {
        throw new UnavailabilityError('Facebook', 'logInWithReadPermissionsAsync');
    }
    if (typeof appId !== 'string') {
        console.warn(`logInWithReadPermissionsAsync: parameter 'appId' must be a string, was '${typeof appId}''.`);
        appId = String(appId);
    }
    if (!options || typeof options !== 'object') {
        options = {};
    }
    return ExponentFacebook.logInWithReadPermissionsAsync(appId, options);
}
//# sourceMappingURL=Facebook.js.map