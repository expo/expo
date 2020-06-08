import { CodedError, RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter } from 'fbemitter';
import invariant from 'invariant';
import { Platform } from 'react-native';
import ExponentNotifications from './ExponentNotifications';
import Storage from './Storage';
let _emitter;
let _initialNotification;
function _maybeInitEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter();
        RCTDeviceEventEmitter.addListener('Exponent.notification', emitNotification);
    }
}
export function emitNotification(notification) {
    if (typeof notification === 'string') {
        notification = JSON.parse(notification);
    }
    /* Don't mutate the original notification */
    notification = { ...notification };
    if (typeof notification.data === 'string') {
        try {
            notification.data = JSON.parse(notification.data);
        }
        catch (e) {
            // It's actually just a string, that's fine
        }
    }
    _emitter.emit('notification', notification);
}
function _processNotification(notification) {
    notification = Object.assign({}, notification);
    if (!notification.data) {
        notification.data = {};
    }
    if (notification.hasOwnProperty('count')) {
        delete notification.count;
    }
    // Delete any Android properties on iOS and merge the iOS properties on root notification object
    if (Platform.OS === 'ios') {
        if (notification.android) {
            delete notification.android;
        }
        if (notification.ios) {
            notification = Object.assign(notification, notification.ios);
            notification.data._displayInForeground = notification.ios._displayInForeground;
            delete notification.ios;
        }
    }
    // Delete any iOS properties on Android and merge the Android properties on root notification
    // object
    if (Platform.OS === 'android') {
        if (notification.ios) {
            delete notification.ios;
        }
        if (notification.android) {
            notification = Object.assign(notification, notification.android);
            delete notification.android;
        }
    }
    return notification;
}
function _validateNotification(notification) {
    if (Platform.OS === 'ios') {
        invariant(!!notification.title && !!notification.body, 'Local notifications on iOS require both a title and a body');
    }
    else if (Platform.OS === 'android') {
        invariant(!!notification.title, 'Local notifications on Android require a title');
    }
}
const ASYNC_STORAGE_PREFIX = '__expo_internal_channel_';
// TODO: remove this before releasing
// this will always be `true` for SDK 28+
const IS_USING_NEW_BINARY = ExponentNotifications && typeof ExponentNotifications.createChannel === 'function';
async function _legacyReadChannel(id) {
    try {
        const channelString = await Storage.getItem(`${ASYNC_STORAGE_PREFIX}${id}`);
        if (channelString) {
            return JSON.parse(channelString);
        }
    }
    catch (e) { }
    return null;
}
function _legacyDeleteChannel(id) {
    return Storage.removeItem(`${ASYNC_STORAGE_PREFIX}${id}`);
}
if (Platform.OS === 'android') {
    Storage.clear = async function (callback) {
        try {
            const keys = await Storage.getAllKeys();
            if (keys && keys.length) {
                const filteredKeys = keys.filter(key => !key.startsWith(ASYNC_STORAGE_PREFIX));
                await Storage.multiRemove(filteredKeys);
            }
            callback && callback();
        }
        catch (e) {
            callback && callback(e);
            throw e;
        }
    };
}
// This codepath will never be triggered in SDK 28 and above
// TODO: remove before releasing
function _legacySaveChannel(id, channel) {
    return Storage.setItem(`${ASYNC_STORAGE_PREFIX}${id}`, JSON.stringify(channel));
}
export default {
    /* Only used internally to initialize the notification from top level props */
    _setInitialNotification(notification) {
        _initialNotification = notification;
    },
    // User passes set of actions titles.
    createCategoryAsync(categoryId, actions, previewPlaceholder) {
        return Platform.OS === 'ios'
            ? ExponentNotifications.createCategoryAsync(categoryId, actions, previewPlaceholder)
            : ExponentNotifications.createCategoryAsync(categoryId, actions);
    },
    deleteCategoryAsync(categoryId) {
        return ExponentNotifications.deleteCategoryAsync(categoryId);
    },
    /* Re-export */
    getExpoPushTokenAsync() {
        if (!ExponentNotifications.getExponentPushTokenAsync) {
            throw new UnavailabilityError('Expo.Notifications', 'getExpoPushTokenAsync');
        }
        if (!Constants.isDevice) {
            throw new Error(`Must be on a physical device to get an Expo Push Token`);
        }
        return ExponentNotifications.getExponentPushTokenAsync();
    },
    getDevicePushTokenAsync: (config) => {
        if (!ExponentNotifications.getDevicePushTokenAsync) {
            throw new UnavailabilityError('Expo.Notifications', 'getDevicePushTokenAsync');
        }
        return ExponentNotifications.getDevicePushTokenAsync(config || {});
    },
    createChannelAndroidAsync(id, channel) {
        if (Platform.OS !== 'android') {
            console.warn(`createChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
            return Promise.resolve();
        }
        // This codepath will never be triggered in SDK 28 and above
        // TODO: remove before releasing
        if (!IS_USING_NEW_BINARY) {
            return _legacySaveChannel(id, channel);
        }
        return ExponentNotifications.createChannel(id, channel);
    },
    deleteChannelAndroidAsync(id) {
        if (Platform.OS !== 'android') {
            console.warn(`deleteChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
            return Promise.resolve();
        }
        // This codepath will never be triggered in SDK 28 and above
        // TODO: remove before releasing
        if (!IS_USING_NEW_BINARY) {
            return Promise.resolve();
        }
        return ExponentNotifications.deleteChannel(id);
    },
    /* Shows a notification instantly */
    async presentLocalNotificationAsync(notification) {
        _validateNotification(notification);
        const nativeNotification = _processNotification(notification);
        if (Platform.OS !== 'android') {
            return await ExponentNotifications.presentLocalNotification(nativeNotification);
        }
        else {
            let _channel;
            if (nativeNotification.channelId) {
                _channel = await _legacyReadChannel(nativeNotification.channelId);
            }
            if (IS_USING_NEW_BINARY) {
                // delete the legacy channel from AsyncStorage so this codepath isn't triggered anymore
                _legacyDeleteChannel(nativeNotification.channelId);
                return ExponentNotifications.presentLocalNotificationWithChannel(nativeNotification, _channel);
            }
            else {
                // TODO: remove this codepath before releasing, it will never be triggered on SDK 28+
                // channel does not actually exist, so add its settings to the individual notification
                if (_channel) {
                    nativeNotification.sound = _channel.sound;
                    nativeNotification.priority = _channel.priority;
                    nativeNotification.vibrate = _channel.vibrate;
                }
                return ExponentNotifications.presentLocalNotification(nativeNotification);
            }
        }
    },
    /* Schedule a notification at a later date */
    async scheduleLocalNotificationAsync(notification, options = {}) {
        // set now at the beginning of the method, to prevent potential weird warnings when we validate
        // options.time later on
        const now = Date.now();
        // Validate and process the notification data
        _validateNotification(notification);
        const nativeNotification = _processNotification(notification);
        // Validate `options.time`
        if (options.time) {
            let timeAsDateObj = null;
            if (options.time && typeof options.time === 'number') {
                timeAsDateObj = new Date(options.time);
                if (timeAsDateObj.toString() === 'Invalid Date') {
                    timeAsDateObj = null;
                }
            }
            else if (options.time && options.time instanceof Date) {
                timeAsDateObj = options.time;
            }
            // If we couldn't convert properly, throw an error
            if (!timeAsDateObj) {
                throw new Error(`Provided value for "time" is invalid. Please verify that it's either a number representing Unix Epoch time in milliseconds, or a valid date object.`);
            }
            // If someone passes in a value that is too small, say, by an order of 1000 (it's common to
            // accidently pass seconds instead of ms), display a warning.
            if (timeAsDateObj.getTime() < now) {
                console.warn(`Provided value for "time" is before the current date. Did you possibly pass number of seconds since Unix Epoch instead of number of milliseconds?`);
            }
            options = {
                ...options,
                time: timeAsDateObj.getTime(),
            };
        }
        if (options.intervalMs != null && options.repeat != null) {
            throw new Error(`Pass either the "repeat" option or "intervalMs" option, not both`);
        }
        // Validate options.repeat
        if (options.repeat != null) {
            const validOptions = new Set(['minute', 'hour', 'day', 'week', 'month', 'year']);
            if (!validOptions.has(options.repeat)) {
                throw new Error(`Pass one of ['minute', 'hour', 'day', 'week', 'month', 'year'] as the value for the "repeat" option`);
            }
        }
        if (options.intervalMs != null) {
            if (Platform.OS === 'ios') {
                throw new Error(`The "intervalMs" option is not supported on iOS`);
            }
            if (options.intervalMs <= 0 || !Number.isInteger(options.intervalMs)) {
                throw new Error(`Pass an integer greater than zero as the value for the "intervalMs" option`);
            }
        }
        if (Platform.OS !== 'android') {
            if (options.repeat) {
                console.warn('Ability to schedule an automatically repeated notification is deprecated on iOS and will be removed in the next SDK release.');
                return ExponentNotifications.legacyScheduleLocalRepeatingNotification(nativeNotification, options);
            }
            return ExponentNotifications.scheduleLocalNotification(nativeNotification, options);
        }
        else {
            let _channel;
            if (nativeNotification.channelId) {
                _channel = await _legacyReadChannel(nativeNotification.channelId);
            }
            if (IS_USING_NEW_BINARY) {
                // delete the legacy channel from AsyncStorage so this codepath isn't triggered anymore
                _legacyDeleteChannel(nativeNotification.channelId);
                return ExponentNotifications.scheduleLocalNotificationWithChannel(nativeNotification, options, _channel);
            }
            else {
                // TODO: remove this codepath before releasing, it will never be triggered on SDK 28+
                // channel does not actually exist, so add its settings to the individual notification
                if (_channel) {
                    nativeNotification.sound = _channel.sound;
                    nativeNotification.priority = _channel.priority;
                    nativeNotification.vibrate = _channel.vibrate;
                }
                return ExponentNotifications.scheduleLocalNotification(nativeNotification, options);
            }
        }
    },
    /* Dismiss currently shown notification with ID (Android only) */
    async dismissNotificationAsync(notificationId) {
        if (!ExponentNotifications.dismissNotification) {
            throw new UnavailabilityError('Expo.Notifications', 'dismissNotification');
        }
        return await ExponentNotifications.dismissNotification(notificationId);
    },
    /* Dismiss all currently shown notifications (Android only) */
    async dismissAllNotificationsAsync() {
        if (!ExponentNotifications.dismissAllNotifications) {
            throw new UnavailabilityError('Expo.Notifications', 'dismissAllNotifications');
        }
        return await ExponentNotifications.dismissAllNotifications();
    },
    /* Cancel scheduled notification notification with ID */
    cancelScheduledNotificationAsync(notificationId) {
        if (Platform.OS === 'android' && typeof notificationId === 'string') {
            return ExponentNotifications.cancelScheduledNotificationWithStringIdAsync(notificationId);
        }
        return ExponentNotifications.cancelScheduledNotificationAsync(notificationId);
    },
    /* Cancel all scheduled notifications */
    cancelAllScheduledNotificationsAsync() {
        return ExponentNotifications.cancelAllScheduledNotificationsAsync();
    },
    /* Primary public api */
    addListener(listener) {
        _maybeInitEmitter();
        if (_initialNotification) {
            const initialNotification = _initialNotification;
            _initialNotification = null;
            setTimeout(() => {
                emitNotification(initialNotification);
            }, 0);
        }
        return _emitter.addListener('notification', listener);
    },
    async getBadgeNumberAsync() {
        if (!ExponentNotifications.getBadgeNumberAsync) {
            return 0;
        }
        return ExponentNotifications.getBadgeNumberAsync();
    },
    async setBadgeNumberAsync(number) {
        if (!ExponentNotifications.setBadgeNumberAsync) {
            throw new UnavailabilityError('Expo.Notifications', 'setBadgeNumberAsync');
        }
        return ExponentNotifications.setBadgeNumberAsync(number);
    },
    async scheduleNotificationWithCalendarAsync(notification, options = {}) {
        const areOptionsValid = (options.month == null || isInRangeInclusive(options.month, 1, 12)) &&
            (options.day == null || isInRangeInclusive(options.day, 1, 31)) &&
            (options.hour == null || isInRangeInclusive(options.hour, 0, 23)) &&
            (options.minute == null || isInRangeInclusive(options.minute, 0, 59)) &&
            (options.second == null || isInRangeInclusive(options.second, 0, 59)) &&
            (options.weekDay == null || isInRangeInclusive(options.weekDay, 1, 7)) &&
            (options.weekDay == null || options.day == null);
        if (!areOptionsValid) {
            throw new CodedError('WRONG_OPTIONS', 'Options in scheduleNotificationWithCalendarAsync call were incorrect!');
        }
        _validateNotification(notification);
        const nativeNotification = _processNotification(notification);
        return ExponentNotifications.scheduleNotificationWithCalendar(nativeNotification, options);
    },
    async scheduleNotificationWithTimerAsync(notification, options) {
        if (options.interval < 1) {
            throw new CodedError('WRONG_OPTIONS', 'Interval must be not less then 1');
        }
        _validateNotification(notification);
        const nativeNotification = _processNotification(notification);
        return ExponentNotifications.scheduleNotificationWithTimer(nativeNotification, options);
    },
};
function isInRangeInclusive(variable, min, max) {
    return variable >= min && variable <= max;
}
//# sourceMappingURL=Notifications.js.map