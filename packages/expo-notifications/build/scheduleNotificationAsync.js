import { Platform, UnavailabilityError } from '@unimodules/core';
import uuidv4 from 'uuid/v4';
import NotificationScheduler from './NotificationScheduler';
export default async function scheduleNotificationAsync(request) {
    if (!NotificationScheduler.scheduleNotificationAsync) {
        throw new UnavailabilityError('Notifications', 'scheduleNotificationAsync');
    }
    return await NotificationScheduler.scheduleNotificationAsync(request.identifier ?? uuidv4(), request.content, parseTrigger(request.trigger));
}
export function parseTrigger(userFacingTrigger) {
    if (userFacingTrigger === null) {
        return null;
    }
    if (userFacingTrigger === undefined) {
        throw new TypeError('Encountered an `undefined` notification trigger. If you want to trigger the notification immediately, pass in an explicit `null` value.');
    }
    if (isDateTrigger(userFacingTrigger)) {
        return parseDateTrigger(userFacingTrigger);
    }
    else if (isDailyTriggerInput(userFacingTrigger)) {
        const hour = userFacingTrigger.hour;
        const minute = userFacingTrigger.minute;
        if (hour === undefined || hour == null || minute === undefined || minute == null) {
            throw new TypeError('Both hour and minute need to have valid values. Found undefined');
        }
        if (hour < 0 || hour > 23) {
            throw new RangeError(`The hour parameter needs to be between 0 and 23. Found: ${hour}`);
        }
        if (minute < 0 || minute > 59) {
            throw new RangeError(`The minute parameter needs to be between 0 and 59. Found: ${minute}`);
        }
        return {
            type: 'daily',
            channelId: userFacingTrigger.channelId,
            hour,
            minute,
        };
    }
    else if (isWeeklyTriggerInput(userFacingTrigger)) {
        const weekday = userFacingTrigger.weekday;
        const hour = userFacingTrigger.hour;
        const minute = userFacingTrigger.minute;
        if (weekday === undefined ||
            weekday == null ||
            hour === undefined ||
            hour == null ||
            minute === undefined ||
            minute == null) {
            throw new TypeError('Weekday, hour and minute need to have valid values. Found undefined');
        }
        if (weekday < 1 || weekday > 7) {
            throw new RangeError(`The weekday parameter needs to be between 1 and 7. Found: ${weekday}`);
        }
        if (hour < 0 || hour > 23) {
            throw new RangeError(`The hour parameter needs to be between 0 and 23. Found: ${hour}`);
        }
        if (minute < 0 || minute > 59) {
            throw new RangeError(`The minute parameter needs to be between 0 and 59. Found: ${minute}`);
        }
        return {
            type: 'weekly',
            channelId: userFacingTrigger.channelId,
            weekday,
            hour,
            minute,
        };
    }
    else if (isSecondsPropertyMisusedInCalendarTriggerInput(userFacingTrigger)) {
        throw new TypeError('Could not have inferred the notification trigger type: if you want to use a time interval trigger, pass in only `seconds` with or without `repeats` property; if you want to use calendar-based trigger, pass in `second`.');
    }
    else if ('seconds' in userFacingTrigger) {
        return {
            type: 'timeInterval',
            channelId: userFacingTrigger.channelId,
            seconds: userFacingTrigger.seconds,
            repeats: userFacingTrigger.repeats ?? false,
        };
    }
    else if (isCalendarTrigger(userFacingTrigger)) {
        const { repeats, ...calendarTrigger } = userFacingTrigger;
        return { type: 'calendar', value: calendarTrigger, repeats };
    }
    else {
        return Platform.select({
            default: null,
            android: { type: 'channel', channelId: userFacingTrigger.channelId },
        });
    }
}
function isCalendarTrigger(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return Object.keys(triggerWithoutChannelId).length > 0;
}
function isDateTrigger(trigger) {
    return (trigger instanceof Date ||
        typeof trigger === 'number' ||
        (typeof trigger === 'object' && 'date' in trigger));
}
function parseDateTrigger(trigger) {
    if (trigger instanceof Date || typeof trigger === 'number') {
        return { type: 'date', timestamp: toTimestamp(trigger) };
    }
    return { type: 'date', timestamp: toTimestamp(trigger.date), channelId: trigger.channelId };
}
function toTimestamp(date) {
    if (date instanceof Date) {
        return date.getTime();
    }
    return date;
}
function isDailyTriggerInput(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return (Object.keys(triggerWithoutChannelId).length === 3 &&
        'hour' in triggerWithoutChannelId &&
        'minute' in triggerWithoutChannelId &&
        'repeats' in triggerWithoutChannelId &&
        triggerWithoutChannelId.repeats === true);
}
function isWeeklyTriggerInput(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return (Object.keys(triggerWithoutChannelId).length === 4 &&
        'weekday' in triggerWithoutChannelId &&
        'hour' in triggerWithoutChannelId &&
        'minute' in triggerWithoutChannelId &&
        'repeats' in triggerWithoutChannelId &&
        triggerWithoutChannelId.repeats === true);
}
function isSecondsPropertyMisusedInCalendarTriggerInput(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return (
    // eg. { seconds: ..., repeats: ..., hour: ... }
    ('seconds' in triggerWithoutChannelId &&
        'repeats' in triggerWithoutChannelId &&
        Object.keys(triggerWithoutChannelId).length > 2) ||
        // eg. { seconds: ..., hour: ... }
        ('seconds' in triggerWithoutChannelId &&
            !('repeats' in triggerWithoutChannelId) &&
            Object.keys(triggerWithoutChannelId).length > 1));
}
//# sourceMappingURL=scheduleNotificationAsync.js.map