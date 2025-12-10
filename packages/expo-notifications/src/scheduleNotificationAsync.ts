import { Platform, UnavailabilityError, uuid } from 'expo-modules-core';

import NotificationScheduler from './NotificationScheduler';
import {
  NativeCalendarTriggerInput,
  NativeDailyTriggerInput,
  NativeDateTriggerInput,
  NativeMonthlyTriggerInput,
  NativeNotificationTriggerInput,
  NativeTimeIntervalTriggerInput,
  NativeWeeklyTriggerInput,
  NativeYearlyTriggerInput,
} from './NotificationScheduler.types';
import {
  NotificationRequestInput,
  NotificationTriggerInput,
  SchedulableTriggerInputTypes,
} from './Notifications.types';
import { hasValidTriggerObject } from './hasValidTriggerObject';

/**
 * Schedules a notification to be triggered in the future.
 * > **Note:** This does not mean that the notification will be presented when it is triggered.
 * For the notification to be presented you have to set a notification handler with [`setNotificationHandler`](#setnotificationhandlerhandler)
 * that will return an appropriate notification behavior. For more information see the example below.
 * @param request An object describing the notification to be triggered.
 * @return Returns a Promise resolving to a string which is a notification identifier you can later use to cancel the notification or to identify an incoming notification.
 * @example
 * # Schedule the notification that will trigger once, in one minute from now
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: "Time's up!",
 *     body: 'Change sides!',
 *   },
 *   trigger: {
 *     type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
 *     seconds: 60,
 *   },
 * });
 * ```
 *
 * # Schedule the notification that will trigger repeatedly, every 20 minutes
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: 'Remember to drink water!',
 *   },
 *   trigger: {
 *     type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
 *     seconds: 60 * 20,
 *     repeats: true,
 *   },
 * });
 * ```
 *
 * # Schedule the notification that will trigger once, at the beginning of next hour
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * const date = new Date(Date.now() + 60 * 60 * 1000);
 * date.setMinutes(0);
 * date.setSeconds(0);
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: 'Happy new hour!',
 *   },
 *   trigger: {
 *     type: Notifications.SchedulableTriggerInputTypes.DATE,
 *     date
 *   },
 * });
 * ```
 * @header schedule
 */
export default async function scheduleNotificationAsync(
  request: NotificationRequestInput
): Promise<string> {
  if (!NotificationScheduler.scheduleNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'scheduleNotificationAsync');
  }

  return await NotificationScheduler.scheduleNotificationAsync(
    request.identifier ?? uuid.v4(),
    request.content,
    parseTrigger(request.trigger)
  );
}

type ValidTriggerDateComponents = 'month' | 'day' | 'weekday' | 'hour' | 'minute';

export function parseTrigger(
  userFacingTrigger: NotificationTriggerInput
): NativeNotificationTriggerInput {
  if (userFacingTrigger === null) {
    return null;
  }

  if (userFacingTrigger === undefined) {
    throw new TypeError(
      'Encountered an `undefined` notification trigger. If you want to trigger the notification immediately, pass in an explicit `null` value.'
    );
  }

  if (!hasValidTriggerObject(userFacingTrigger)) {
    throw new TypeError(
      `The \`trigger\` object you provided is invalid. It needs to contain a \`type\` or \`channelId\` entry. Refer to the documentation to update your code: https://docs.expo.dev/versions/latest/sdk/notifications/#notificationtriggerinput`
    );
  }
  const dateTrigger = parseDateTrigger(userFacingTrigger);
  if (dateTrigger) {
    return dateTrigger;
  }
  const calendarTrigger = parseCalendarTrigger(userFacingTrigger);
  if (calendarTrigger) {
    return calendarTrigger;
  }
  const dailyTrigger = parseDailyTrigger(userFacingTrigger);
  if (dailyTrigger) {
    return dailyTrigger;
  }
  const weeklyTrigger = parseWeeklyTrigger(userFacingTrigger);
  if (weeklyTrigger) {
    return weeklyTrigger;
  }
  const monthlyTrigger = parseMonthlyTrigger(userFacingTrigger);
  if (monthlyTrigger) {
    return monthlyTrigger;
  }
  const yearlyTrigger = parseYearlyTrigger(userFacingTrigger);
  if (yearlyTrigger) {
    return yearlyTrigger;
  }
  const timeIntervalTrigger = parseTimeIntervalTrigger(userFacingTrigger);
  if (timeIntervalTrigger) {
    return timeIntervalTrigger;
  }
  return Platform.select({
    default: null, // There's no notion of channels on platforms other than Android.
    android: {
      type: 'channel',
      channelId:
        typeof userFacingTrigger === 'object' &&
        userFacingTrigger !== null &&
        !(userFacingTrigger instanceof Date)
          ? userFacingTrigger?.channelId
          : undefined,
    },
  });
}

function parseCalendarTrigger(
  trigger: NotificationTriggerInput
): NativeCalendarTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.CALENDAR
  ) {
    const { repeats, ...calendarTrigger } = trigger;
    return { ...calendarTrigger, repeats: !!repeats, type: 'calendar' };
  }
  return undefined;
}

function parseDateTrigger(trigger: NotificationTriggerInput): NativeDateTriggerInput | undefined {
  if (trigger instanceof Date || typeof trigger === 'number') {
    // TODO @vonovak this branch is not be used by people using TS
    // but was part of the public api previously so we keep it for a bit for JS users
    console.warn(
      `You are using a deprecated parameter type (${trigger}) for the notification trigger. Use "{ type: 'date', date: someValue }" instead.`
    );
    return { type: 'date', timestamp: toTimestamp(trigger) };
  } else if (
    typeof trigger === 'object' &&
    trigger !== null &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.DATE &&
    'date' in trigger
  ) {
    const result: NativeDateTriggerInput = {
      type: 'date',
      timestamp: toTimestamp(trigger.date),
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  } else {
    return undefined;
  }
}

function toTimestamp(date: number | Date) {
  if (date instanceof Date) {
    return date.getTime();
  }
  return date;
}

function parseDailyTrigger(trigger: NotificationTriggerInput): NativeDailyTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.DAILY
  ) {
    validateDateComponentsInTrigger(trigger, ['hour', 'minute']);
    const result: NativeDailyTriggerInput = {
      type: 'daily',
      hour: trigger.hour ?? placeholderDateComponentValue,
      minute: trigger.minute ?? placeholderDateComponentValue,
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  }
  return undefined;
}

function parseWeeklyTrigger(
  trigger: NotificationTriggerInput
): NativeWeeklyTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.WEEKLY
  ) {
    validateDateComponentsInTrigger(trigger, ['weekday', 'hour', 'minute']);
    const result: NativeWeeklyTriggerInput = {
      type: 'weekly',
      weekday: trigger.weekday ?? placeholderDateComponentValue,
      hour: trigger.hour ?? placeholderDateComponentValue,
      minute: trigger.minute ?? placeholderDateComponentValue,
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  }
  return undefined;
}

function parseMonthlyTrigger(
  trigger: NotificationTriggerInput
): NativeMonthlyTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.MONTHLY
  ) {
    validateDateComponentsInTrigger(trigger, ['day', 'hour', 'minute']);
    const result: NativeMonthlyTriggerInput = {
      type: 'monthly',
      day: trigger.day ?? placeholderDateComponentValue,
      hour: trigger.hour ?? placeholderDateComponentValue,
      minute: trigger.minute ?? placeholderDateComponentValue,
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  }
  return undefined;
}

function parseYearlyTrigger(
  trigger: NotificationTriggerInput
): NativeYearlyTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.YEARLY
  ) {
    validateDateComponentsInTrigger(trigger, ['month', 'day', 'hour', 'minute']);
    const result: NativeYearlyTriggerInput = {
      type: 'yearly',
      month: trigger.month ?? placeholderDateComponentValue,
      day: trigger.day ?? placeholderDateComponentValue,
      hour: trigger.hour ?? placeholderDateComponentValue,
      minute: trigger.minute ?? placeholderDateComponentValue,
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  }
  return undefined;
}

function parseTimeIntervalTrigger(
  trigger: NotificationTriggerInput
): NativeTimeIntervalTriggerInput | undefined {
  if (
    trigger !== null &&
    typeof trigger === 'object' &&
    'type' in trigger &&
    trigger.type === SchedulableTriggerInputTypes.TIME_INTERVAL &&
    'seconds' in trigger &&
    typeof trigger.seconds === 'number'
  ) {
    const result: NativeTimeIntervalTriggerInput = {
      type: 'timeInterval',
      seconds: trigger.seconds,
      repeats: trigger.repeats ?? false,
    };
    if (trigger.channelId) {
      result.channelId = trigger.channelId;
    }
    return result;
  }
  return undefined;
}

// Needed only to satisfy Typescript types for validated date components
const placeholderDateComponentValue = -9999;

function validateDateComponentsInTrigger(
  trigger: NonNullable<NotificationTriggerInput>,
  components: readonly ValidTriggerDateComponents[]
) {
  const anyTriggerType = trigger as any;
  components.forEach((component) => {
    if (!(component in anyTriggerType)) {
      throw new TypeError(`The ${component} parameter needs to be present`);
    }
    if (typeof anyTriggerType[component] !== 'number') {
      throw new TypeError(`The ${component} parameter should be a number`);
    }
    switch (component) {
      case 'month': {
        const { month } = anyTriggerType;
        if (month < 0 || month > 11) {
          throw new RangeError(`The month parameter needs to be between 0 and 11. Found: ${month}`);
        }
        break;
      }
      case 'day': {
        const day = anyTriggerType.day;
        const month =
          anyTriggerType.month !== undefined ? anyTriggerType.month : new Date().getMonth();
        const daysInGivenMonth = daysInMonth(month);
        if (day < 1 || day > daysInGivenMonth) {
          throw new RangeError(
            `The day parameter for month ${month} must be between 1 and ${daysInGivenMonth}. Found: ${day}`
          );
        }
        break;
      }
      case 'weekday': {
        const { weekday } = anyTriggerType;
        if (weekday < 1 || weekday > 7) {
          throw new RangeError(
            `The weekday parameter needs to be between 1 and 7. Found: ${weekday}`
          );
        }
        break;
      }
      case 'hour': {
        const { hour } = anyTriggerType;
        if (hour < 0 || hour > 23) {
          throw new RangeError(`The hour parameter needs to be between 0 and 23. Found: ${hour}`);
        }
        break;
      }
      case 'minute': {
        const { minute } = anyTriggerType;
        if (minute < 0 || minute > 59) {
          throw new RangeError(
            `The minute parameter needs to be between 0 and 59. Found: ${minute}`
          );
        }
        break;
      }
    }
  });
}

/**
 * Determines the number of days in the given month (or January if omitted).
 * If year is specified, it will include leap year logic, else it will always assume a leap year
 */
function daysInMonth(month: number = 0, year?: number) {
  return new Date(year ?? 2000, month + 1, 0).getDate();
}
