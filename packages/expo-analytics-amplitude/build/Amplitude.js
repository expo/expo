import { UnavailabilityError } from '@unimodules/core';
import ExpoAmplitude from './ExpoAmplitude';
export function initialize(apiKey) {
    if (!ExpoAmplitude.initialize) {
        throw new UnavailabilityError('Amplitude', 'initialize');
    }
    return ExpoAmplitude.initialize(apiKey);
}
;
export function setUserId(userId) {
    if (!ExpoAmplitude.setUserId) {
        throw new UnavailabilityError('Amplitude', 'setUserId');
    }
    return ExpoAmplitude.setUserId(userId);
}
;
export function setUserProperties(userProperties) {
    if (!ExpoAmplitude.setUserProperties) {
        throw new UnavailabilityError('Amplitude', 'setUserProperties');
    }
    return ExpoAmplitude.setUserProperties(userProperties);
}
;
export function clearUserProperties() {
    if (!ExpoAmplitude.clearUserProperties) {
        throw new UnavailabilityError('Amplitude', 'clearUserProperties');
    }
    return ExpoAmplitude.clearUserProperties();
}
;
export function logEvent(eventName) {
    if (!ExpoAmplitude.logEvent) {
        throw new UnavailabilityError('Amplitude', 'logEvent');
    }
    return ExpoAmplitude.logEvent(eventName);
}
;
export function logEventWithProperties(eventName, properties) {
    if (!ExpoAmplitude.logEventWithProperties) {
        throw new UnavailabilityError('Amplitude', 'logEventWithProperties');
    }
    return ExpoAmplitude.logEventWithProperties(eventName, properties);
}
;
export function setGroup(groupType, groupNames) {
    if (!ExpoAmplitude.setGroup) {
        throw new UnavailabilityError('Amplitude', 'setGroup');
    }
    return ExpoAmplitude.setGroup(groupType, groupNames);
}
;
//# sourceMappingURL=Amplitude.js.map