import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExponentSegment from './ExponentSegment';
// @needsAudit
/**
 * Segment requires separate write keys for iOS and Android. You will need to log in to Segment
 * to receive these keys: [https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/](https://segment.com/docs/guides/setup/how-do-i-find-my-write-key/)
 *
 * @param options An [`InitializeOptions`](#initializeoptions) object.
 */
export function initialize(options) {
    if (!ExponentSegment.initialize) {
        throw new UnavailabilityError('expo-analytics-segment', 'initialize');
    }
    const platformWriteKey = Platform.select({
        ios: options.iosWriteKey,
        android: options.androidWriteKey,
    });
    if (platformWriteKey) {
        ExponentSegment.initialize(platformWriteKey);
    }
    else {
        throw new Error('You must provide a platform-specific write key to initialize Segment.');
    }
}
// @needsAudit
/**
 * Associates the current user with a user ID. Call this after calling [`Segment.initialize()`](#initialize)
 * but before other segment calls. See [Segment Identify docs](https://segment.com/docs/spec/identify/).
 * @param userId User ID for the current user.
 */
export function identify(userId) {
    if (!ExponentSegment.identify) {
        throw new UnavailabilityError('expo-analytics-segment', 'identify');
    }
    ExponentSegment.identify(userId);
}
// @needsAudit @docsMissing
/**
 * @param userId User ID for the current user.
 * @param traits A map of custom properties.
 * @param options Map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export function identifyWithTraits(userId, traits, options = null) {
    if (!ExponentSegment.identifyWithTraits) {
        throw new UnavailabilityError('expo-analytics-segment', 'identifyWithTraits');
    }
    ExponentSegment.identifyWithTraits(userId, traits, options);
}
// @needsAudit
/**
 * Associate the user with a group. See [Segment Group docs](https://segment.com/docs/spec/group/).
 *
 * @param groupId ID of the group.
 */
export function group(groupId) {
    if (!ExponentSegment.group) {
        throw new UnavailabilityError('expo-analytics-segment', 'group');
    }
    ExponentSegment.group(groupId);
}
// @needsAudit
/**
 * Associate the user with a group with traits. See [Segment Group docs](https://segment.com/docs/spec/group/).
 *
 * @param groupId ID of the group.
 * @param traits Free-form dictionary of traits of the group.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export function groupWithTraits(groupId, traits, options = null) {
    if (!ExponentSegment.groupWithTraits) {
        throw new UnavailabilityError('expo-analytics-segment', 'groupWithTraits');
    }
    ExponentSegment.groupWithTraits(groupId, traits, options);
}
// @needsAudit
/**
 * Associate current identity with a new identifier. See [Segment Alias docs](https://segment.com/docs/spec/alias/).
 *
 * @param newId Identifier to associate with.
 * @param options An extra dictionary with options for the call, [see here](https://segment.com/docs/connections/spec/common/)
 * for possible configuration options. An example options object would be:
 * ```json
 * {
 *   "integrations": {
 *     "Sentry": {
 *       "enabled": true
 *      }
 *   },
 *   "context": {
 *     "ip": "0.0.0.0"
 *   }
 * }
 * ```
 *
 * @return A `Promise` which fulfils witch a `boolean` indicating whether the method has been
 * executed on the underlying `Segment` instance or not.
 */
export async function alias(newId, options = null) {
    if (!ExponentSegment.alias) {
        throw new UnavailabilityError('expo-analytics-segment', 'alias');
    }
    return await ExponentSegment.alias(newId, options);
}
// @needsAudit
/**
 * Clears the current user. See [https://segment.com/docs/sources/mobile/ios/#reset](https://segment.com/docs/sources/mobile/ios/#reset).
 */
export function reset() {
    if (!ExponentSegment.reset) {
        throw new UnavailabilityError('expo-analytics-segment', 'reset');
    }
    ExponentSegment.reset();
}
// @needsAudit
/**
 * Log an event to Segment. See [Segment Track docs](https://segment.com/docs/spec/track/).
 *
 * @param event The event name.
 */
export function track(event) {
    if (!ExponentSegment.track) {
        throw new UnavailabilityError('expo-analytics-segment', 'track');
    }
    ExponentSegment.track(event);
}
// @needsAudit
/**
 * Log an event to Segment with custom properties. See [Segment Track docs](https://segment.com/docs/spec/track/).
 *
 * @param event The event name.
 * @param properties A map of custom properties.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export function trackWithProperties(event, properties, options = null) {
    if (!ExponentSegment.trackWithProperties) {
        throw new UnavailabilityError('expo-analytics-segment', 'trackWithProperties');
    }
    ExponentSegment.trackWithProperties(event, properties, options);
}
// @needsAudit
/**
 * Record that a user has seen a screen to Segment. See [Segment Screen docs](https://segment.com/docs/spec/screen/).
 *
 * @param screenName Name of the screen.
 */
export function screen(screenName) {
    if (!ExponentSegment.screen) {
        throw new UnavailabilityError('expo-analytics-segment', 'screen');
    }
    ExponentSegment.screen(screenName);
}
// @needsAudit
/**
 * Record that a user has seen a screen to Segment with custom properties. See [Segment Screen docs](https://segment.com/docs/spec/screen/).
 *
 * @param screenName Name of the screen.
 * @param properties A map of custom properties.
 * @param options A map that can include any of [these common fields](https://segment.com/docs/connections/spec/common/).
 * Defaults to `null`.
 */
export function screenWithProperties(screenName, properties, options = null) {
    if (!ExponentSegment.screenWithProperties) {
        throw new UnavailabilityError('expo-analytics-segment', 'screenWithProperties');
    }
    ExponentSegment.screenWithProperties(screenName, properties, options);
}
// @needsAudit
/**
 * Manually flush the event queue. You shouldn't need to call this in most cases.
 */
export function flush() {
    if (!ExponentSegment.flush) {
        throw new UnavailabilityError('expo-analytics-segment', 'flush');
    }
    ExponentSegment.flush();
}
// @missingDocs
export async function getEnabledAsync() {
    if (!ExponentSegment.getEnabledAsync) {
        throw new UnavailabilityError('expo-analytics-segment', 'getEnabledAsync');
    }
    const isEnabledNumber = await ExponentSegment.getEnabledAsync();
    return !!isEnabledNumber;
}
// @missingDocs
export async function setEnabledAsync(enabled) {
    if (!ExponentSegment.setEnabledAsync) {
        throw new UnavailabilityError('expo-analytics-segment', 'setEnabledAsync');
    }
    await ExponentSegment.setEnabledAsync(enabled);
}
//# sourceMappingURL=Segment.js.map