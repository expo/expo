import { UnavailabilityError } from 'expo-errors';
import ExponentAmplitude from './ExponentAmplitude';
export async function initialize(apiKey) {
    if (!ExponentAmplitude.initialize) {
        throw new UnavailabilityError('Amplitude', 'initialize');
    }
    return ExponentAmplitude.initialize(apiKey);
}
export async function setUserId(userId) {
    if (!ExponentAmplitude.setUserId) {
        throw new UnavailabilityError('Amplitude', 'setUserId');
    }
    return ExponentAmplitude.setUserId(userId);
}
export async function setUserProperties(userProperties) {
    if (!ExponentAmplitude.setUserProperties) {
        throw new UnavailabilityError('Amplitude', 'setUserProperties');
    }
    return ExponentAmplitude.setUserProperties(userProperties);
}
export async function clearUserProperties() {
    if (!ExponentAmplitude.clearUserProperties) {
        throw new UnavailabilityError('Amplitude', 'clearUserProperties');
    }
    return ExponentAmplitude.clearUserProperties();
}
export async function logEvent(eventName) {
    if (!ExponentAmplitude.logEvent) {
        throw new UnavailabilityError('Amplitude', 'logEvent');
    }
    return ExponentAmplitude.logEvent(eventName);
}
export async function logEventWithProperties(eventName, properties) {
    if (!ExponentAmplitude.logEventWithProperties) {
        throw new UnavailabilityError('Amplitude', 'logEventWithProperties');
    }
    return ExponentAmplitude.logEventWithProperties(eventName, properties);
}
export async function setGroup(groupType, groupNames) {
    if (!ExponentAmplitude.setGroup) {
        throw new UnavailabilityError('Amplitude', 'setGroup');
    }
    return ExponentAmplitude.setGroup(groupType, groupNames);
}
//# sourceMappingURL=Amplitude.js.map