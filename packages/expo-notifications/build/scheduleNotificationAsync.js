import { UnavailabilityError } from '@unimodules/core';
import uuidv4 from 'uuid/v4';
import NotificationScheduler from './NotificationScheduler';
export default async function scheduleNotificationAsync(request) {
    if (!NotificationScheduler.scheduleNotificationAsync) {
        throw new UnavailabilityError('Notifications', 'scheduleNotificationAsync');
    }
    return await NotificationScheduler.scheduleNotificationAsync(request.identifier ?? uuidv4(), request.content, parseTrigger(request.trigger));
}
function parseTrigger(userFacingTrigger) {
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
        // @ts-ignore Type '"channel"' is not assignable to type '"daily"'.ts(2322)
        return { type: 'channel', channelId: userFacingTrigger.channelId };
    }
}
function isCalendarTrigger(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return Object.keys(triggerWithoutChannelId).length > 0;
}
function isDateTrigger(trigger) {
    return (trigger instanceof Date ||
        typeof trigger === 'number' ||
        (typeof trigger === 'object' && trigger['date']));
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
    return (Object.keys(trigger).length === 3 &&
        'hour' in trigger &&
        'minute' in trigger &&
        'repeats' in trigger &&
        trigger.repeats === true);
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