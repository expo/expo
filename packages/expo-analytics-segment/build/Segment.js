import { Platform } from 'react-native';
import { UnavailabilityError } from '@unimodules/core';
import ExponentSegment from './ExponentSegment';
export function initialize(options) {
    if (Platform.OS === 'android') {
        ExponentSegment.initializeAndroid(options.androidWriteKey);
    }
    else if (Platform.OS === 'ios') {
        ExponentSegment.initializeIOS(options.iosWriteKey);
    }
    else {
        throw new UnavailabilityError('expo-analytics-segment', 'initialize');
    }
}
export function identify(userId) {
    if (!ExponentSegment.identify) {
        throw new UnavailabilityError('expo-analytics-segment', 'identify');
    }
    ExponentSegment.identify(userId);
}
export function identifyWithTraits(userId, traits) {
    if (!ExponentSegment.identifyWithTraits) {
        throw new UnavailabilityError('expo-analytics-segment', 'identifyWithTraits');
    }
    ExponentSegment.identifyWithTraits(userId, traits);
}
export function group(groupId) {
    if (!ExponentSegment.group) {
        throw new UnavailabilityError('expo-analytics-segment', 'group');
    }
    ExponentSegment.group(groupId);
}
export function groupWithTraits(groupId, traits) {
    if (!ExponentSegment.groupWithTraits) {
        throw new UnavailabilityError('expo-analytics-segment', 'groupWithTraits');
    }
    ExponentSegment.groupWithTraits(groupId, traits);
}
export async function alias(newId, options) {
    if (!ExponentSegment.alias) {
        throw new UnavailabilityError('expo-analytics-segment', 'alias');
    }
    return await ExponentSegment.alias(newId, options);
}
export function reset() {
    if (!ExponentSegment.reset) {
        throw new UnavailabilityError('expo-analytics-segment', 'reset');
    }
    ExponentSegment.reset();
}
export function track(event) {
    if (!ExponentSegment.track) {
        throw new UnavailabilityError('expo-analytics-segment', 'track');
    }
    ExponentSegment.track(event);
}
export function trackWithProperties(event, properties) {
    if (!ExponentSegment.trackWithProperties) {
        throw new UnavailabilityError('expo-analytics-segment', 'trackWithProperties');
    }
    ExponentSegment.trackWithProperties(event, properties);
}
export function screen(screenName) {
    if (!ExponentSegment.screen) {
        throw new UnavailabilityError('expo-analytics-segment', 'screen');
    }
    ExponentSegment.screen(screenName);
}
export function screenWithProperties(event, properties) {
    if (!ExponentSegment.screenWithProperties) {
        throw new UnavailabilityError('expo-analytics-segment', 'screenWithProperties');
    }
    ExponentSegment.screenWithProperties(event, properties);
}
export function flush() {
    if (!ExponentSegment.flush) {
        throw new UnavailabilityError('expo-analytics-segment', 'flush');
    }
    ExponentSegment.flush();
}
export async function getEnabledAsync() {
    if (!ExponentSegment.getEnabledAsync) {
        throw new UnavailabilityError('expo-analytics-segment', 'getEnabledAsync');
    }
    const isEnabledNumber = await ExponentSegment.getEnabledAsync();
    return !!isEnabledNumber;
}
export async function setEnabledAsync(enabled) {
    if (!ExponentSegment.setEnabledAsync) {
        throw new UnavailabilityError('expo-analytics-segment', 'setEnabledAsync');
    }
    await ExponentSegment.setEnabledAsync(enabled);
}
//# sourceMappingURL=Segment.js.map