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
        validateDateComponents(userFacingTrigger, { hour: true, minute: true });
        return {
            type: 'daily',
            channelId: userFacingTrigger.channelId,
            hour: userFacingTrigger.hour,
            minute: userFacingTrigger.minute,
        };
    }
    else if (isWeeklyTriggerInput(userFacingTrigger)) {
        validateDateComponents(userFacingTrigger, { weekday: true, hour: true, minute: true });
        return {
            type: 'weekly',
            channelId: userFacingTrigger.channelId,
            weekday: userFacingTrigger.weekday,
            hour: userFacingTrigger.hour,
            minute: userFacingTrigger.minute,
        };
    }
    else if (isYearlyTriggerInput(userFacingTrigger)) {
        validateDateComponents(userFacingTrigger, { day: true, month: true, hour: true, minute: true });
        return {
            type: 'yearly',
            channelId: userFacingTrigger.channelId,
            day: userFacingTrigger.day,
            month: userFacingTrigger.month,
            hour: userFacingTrigger.hour,
            minute: userFacingTrigger.minute,
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
function isYearlyTriggerInput(trigger) {
    const { channelId, ...triggerWithoutChannelId } = trigger;
    return (Object.keys(triggerWithoutChannelId).length === 5 &&
        'day' in triggerWithoutChannelId &&
        'month' in triggerWithoutChannelId &&
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
function validateDateComponents(object, components) {
    const expectedProperties = Object.keys(components).filter(key => components[key]);
    if (expectedProperties.some(component => object[component] === undefined || object[component] === null)) {
        const headParams = [...expectedProperties];
        const tailParam = headParams.pop();
        const paramsText = headParams.length ? `${headParams.join(', ')} and ${tailParam}` : tailParam;
        const plural = expectedProperties.length;
        throw new TypeError(`Parameter${plural ? 's' : ''} ${paramsText} need${plural ? '' : 's'} to have valid values. Found undefined`);
    }
    if (components.month) {
        const { month } = object;
        if (month < 0 || month > 11) {
            throw new RangeError(`The month parameter needs to be between 0 and 11. Found: ${month}`);
        }
    }
    if (components.day) {
        const { day, month } = object;
        const daysInGivenMonth = daysInMonth(month);
        if (day < 1 || day > daysInGivenMonth) {
            throw new RangeError(`The day parameter needs to be between 1 and the amount of days for the given month (${daysInGivenMonth} for month ${object.month}). Found: ${day}`);
        }
    }
    if (components.weekday) {
        const { weekday } = object;
        if (weekday < 1 || weekday > 7) {
            throw new RangeError(`The weekday parameter needs to be between 1 and 7. Found: ${weekday}`);
        }
    }
    if (components.hour) {
        const { hour } = object;
        if (hour < 0 || hour > 23) {
            throw new RangeError(`The hour parameter needs to be between 0 and 23. Found: ${hour}`);
        }
    }
    if (components.minute) {
        const { minute } = object;
        if (minute < 0 || minute > 59) {
            throw new RangeError(`The minute parameter needs to be between 0 and 59. Found: ${minute}`);
        }
    }
}
/**
 * Determines the number of days in the given month. If year is specified, it will include
 * leap year logic, else it will always assume a leap year
 */
function daysInMonth(month, year) {
    switch (month) {
        case 1:
            return year === undefined || isLeapYear(year) ? 29 : 28;
        case 3:
        case 5:
        case 8:
        case 10:
            return 30;
        default:
            return 31;
    }
}
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
//# sourceMappingURL=scheduleNotificationAsync.js.map