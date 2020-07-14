import { UnavailabilityError } from '@unimodules/core';
import ExpoAmplitude from './ExpoAmplitude';
export function initialize(apiKey) {
    if (!ExpoAmplitude.initialize) {
        throw new UnavailabilityError('Amplitude', 'initialize');
    }
    ExpoAmplitude.initialize(apiKey);
}
export function setUserId(userId) {
    if (!ExpoAmplitude.setUserId) {
        throw new UnavailabilityError('Amplitude', 'setUserId');
    }
    ExpoAmplitude.setUserId(userId);
}
export function setUserProperties(userProperties) {
    if (!ExpoAmplitude.setUserProperties) {
        throw new UnavailabilityError('Amplitude', 'setUserProperties');
    }
    ExpoAmplitude.setUserProperties(userProperties);
}
export function clearUserProperties() {
    if (!ExpoAmplitude.clearUserProperties) {
        throw new UnavailabilityError('Amplitude', 'clearUserProperties');
    }
    ExpoAmplitude.clearUserProperties();
}
export async function logEventAsync(eventName) {
    if (!ExpoAmplitude.logEventAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventAsync');
    }
    return ExpoAmplitude.logEventAsync(eventName);
}
export async function logEventWithPropertiesAsync(eventName, properties) {
    if (!ExpoAmplitude.logEventWithPropertiesAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
    }
    return ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}
export function setGroup(groupType, groupNames) {
    if (!ExpoAmplitude.setGroup) {
        throw new UnavailabilityError('Amplitude', 'setGroup');
    }
    ExpoAmplitude.setGroup(groupType, groupNames);
}
export function setTrackingOptions(options) {
    if (!ExpoAmplitude.setTrackingOptions) {
        throw new UnavailabilityError('Amplitude', 'setTrackingOptions');
    }
    return ExpoAmplitude.setTrackingOptions(options);
}
// Keep to avoid an abrupt breaking change, remove for SDK 40
export function logEvent(eventName) {
    console.log('This method is deprecated. Please use Amplitude.logEventAsync instead (it is functionally the same).');
    if (!ExpoAmplitude.logEventAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventAsync');
    }
    return ExpoAmplitude.logEventAsync(eventName);
}
export function logEventWithProperties(eventName, properties) {
    console.log('This method is deprecated. Please use Amplitude.logEventWithPropertiesAsync instead (it is functionally the same).');
    if (!ExpoAmplitude.logEventWithPropertiesAsync) {
        throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
    }
    return ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}
//# sourceMappingURL=Amplitude.js.map