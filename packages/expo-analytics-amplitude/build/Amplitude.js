import { UnavailabilityError } from '@unimodules/core';
import ExpoAmplitude from './ExpoAmplitude';
export async function initializeAsync(apiKey) {
    if (!ExpoAmplitude.initializeAsync) {
        throw new UnavailabilityError('Amplitude', 'initializeAsync');
    }
    return await ExpoAmplitude.initializeAsync(apiKey);
}
export async function setUserIdAsync(userId) {
    if (!ExpoAmplitude.setUserIdAsync) {
        throw new UnavailabilityError('Amplitude', 'setUserIdAsync');
    }
    return await ExpoAmplitude.setUserIdAsync(userId);
}
export async function setUserPropertiesAsync(userProperties) {
    if (!ExpoAmplitude.setUserPropertiesAsync) {
        throw new UnavailabilityError('Amplitude', 'setUserPropertiesAsync');
    }
    return await ExpoAmplitude.setUserPropertiesAsync(userProperties);
}
export async function clearUserPropertiesAsync() {
    if (!ExpoAmplitude.clearUserPropertiesAsync) {
        throw new UnavailabilityError('Amplitude', 'clearUserPropertiesAsync');
    }
    return await ExpoAmplitude.clearUserPropertiesAsync();
}
export async function logEventAsync(eventName) {
    if (!ExpoAmplitude.logEventAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventAsync');
    }
    return await ExpoAmplitude.logEventAsync(eventName);
}
export async function logEventWithPropertiesAsync(eventName, properties) {
    if (!ExpoAmplitude.logEventWithPropertiesAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
    }
    return await ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}
export async function setGroupAsync(groupType, groupNames) {
    if (!ExpoAmplitude.setGroupAsync) {
        throw new UnavailabilityError('Amplitude', 'setGroupAsync');
    }
    return await ExpoAmplitude.setGroupAsync(groupType, groupNames);
}
export async function setTrackingOptionsAsync(options) {
    if (!ExpoAmplitude.setTrackingOptionsAsync) {
        throw new UnavailabilityError('Amplitude', 'setTrackingOptionsAsync');
    }
    return await ExpoAmplitude.setTrackingOptionsAsync(options);
}
/*
 * Legacy methods for backwards-compatibility.
 * These should be removed in SDK 41
 */
export async function initialize(apiKey) {
    console.warn("'Amplitude.initialize' is deprecated in favor of 'Amplitude.initializeAsync'. Please use the new method, which contains no user-facing changes.");
    return await initializeAsync(apiKey);
}
export async function setUserId(userId) {
    console.warn("'Amplitude.setUserId' is deprecated in favor of 'Amplitude.setUserIdAsync'. Please use the new method, which contains no user-facing changes.");
    return await setUserIdAsync(userId);
}
export async function setUserProperties(userProperties) {
    console.warn("'Amplitude.setUserProperties' is deprecated in favor of 'Amplitude.setUserPropertiesAsync'. Please use the new method, which contains no user-facing changes.");
    return await setUserPropertiesAsync(userProperties);
}
export async function clearUserProperties() {
    console.warn("'Amplitude.clearUserProperties' is deprecated in favor of 'Amplitude.clearUserPropertiesAsync'. Please use the new method, which contains no user-facing changes.");
    return await clearUserPropertiesAsync();
}
export async function logEvent(eventName) {
    console.warn("'Amplitude.logEvent' is deprecated in favor of 'Amplitude.logEventAsync'. Please use the new method, which contains no user-facing changes.");
    return await logEventAsync(eventName);
}
export async function logEventWithProperties(eventName, properties) {
    console.warn("'Amplitude.logEventWithProperties' is deprecated in favor of 'Amplitude.logEventWithPropertiesAsync'. Please use the new method, which contains no user-facing changes.");
    return await logEventWithPropertiesAsync(eventName, properties);
}
export async function setGroup(groupType, groupNames) {
    console.warn("'Amplitude.setGroup' is deprecated in favor of 'Amplitude.setGroupAsync'. Please use the new method, which contains no user-facing changes.");
    return await setGroupAsync(groupType, groupNames);
}
export async function setTrackingOptions(options) {
    console.warn("'Amplitude.setTrackingOptions' is deprecated in favor of 'Amplitude.setTrackingOptionsAsync'. Please use the new method, which contains no user-facing changes.");
    return await setTrackingOptionsAsync(options);
}
//# sourceMappingURL=Amplitude.js.map