import { Platform, UnavailabilityError } from 'expo-modules-core';
import { v4 as uuidv4 } from 'uuid';

import NotificationScheduler from './NotificationScheduler';
import { NotificationTriggerInput as NativeNotificationTriggerInput } from './NotificationScheduler.types';
import {
  NotificationRequestInput,
  NotificationTriggerInput,
  DailyTriggerInput,
  WeeklyTriggerInput,
  YearlyTriggerInput,
  CalendarTriggerInput,
  TimeIntervalTriggerInput,
  DateTriggerInput,
  ChannelAwareTriggerInput,
  SchedulableNotificationTriggerInput,
} from './Notifications.types';

/**
 * Schedules a notification to be triggered in the future.
 * > **Note:** Please note that this does not mean that the notification will be presented when it is triggered.
 * For the notification to be presented you have to set a notification handler with [`setNotificationHandler`](#notificationssetnotificationhandlerhandler)
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
 * const trigger = new Date(Date.now() + 60 * 60 * 1000);
 * trigger.setMinutes(0);
 * trigger.setSeconds(0);
 *
 * Notifications.scheduleNotificationAsync({
 *   content: {
 *     title: 'Happy new hour!',
 *   },
 *   trigger,
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
    request.identifier ?? uuidv4(),
    request.content,
    parseTrigger(request.trigger)
  );
}

type ValidTriggerDateComponents = 'month' | 'day' | 'weekday' | 'hour' | 'minute';

const DAILY_TRIGGER_EXPECTED_DATE_COMPONENTS: readonly ValidTriggerDateComponents[] = [
  'hour',
  'minute',
];
const WEEKLY_TRIGGER_EXPECTED_DATE_COMPONENTS: readonly ValidTriggerDateComponents[] = [
  'weekday',
  'hour',
  'minute',
];
const YEARLY_TRIGGER_EXPECTED_DATE_COMPONENTS: readonly ValidTriggerDateComponents[] = [
  'day',
  'month',
  'hour',
  'minute',
];

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

  if (isDateTrigger(userFacingTrigger)) {
    return parseDateTrigger(userFacingTrigger);
  } else if (isDailyTriggerInput(userFacingTrigger)) {
    validateDateComponentsInTrigger(userFacingTrigger, DAILY_TRIGGER_EXPECTED_DATE_COMPONENTS);
    return {
      type: 'daily',
      channelId: userFacingTrigger.channelId,
      hour: userFacingTrigger.hour,
      minute: userFacingTrigger.minute,
    };
  } else if (isWeeklyTriggerInput(userFacingTrigger)) {
    validateDateComponentsInTrigger(userFacingTrigger, WEEKLY_TRIGGER_EXPECTED_DATE_COMPONENTS);
    return {
      type: 'weekly',
      channelId: userFacingTrigger.channelId,
      weekday: userFacingTrigger.weekday,
      hour: userFacingTrigger.hour,
      minute: userFacingTrigger.minute,
    };
  } else if (isYearlyTriggerInput(userFacingTrigger)) {
    validateDateComponentsInTrigger(userFacingTrigger, YEARLY_TRIGGER_EXPECTED_DATE_COMPONENTS);
    return {
      type: 'yearly',
      channelId: userFacingTrigger.channelId,
      day: userFacingTrigger.day,
      month: userFacingTrigger.month,
      hour: userFacingTrigger.hour,
      minute: userFacingTrigger.minute,
    };
  } else if (isSecondsPropertyMisusedInCalendarTriggerInput(userFacingTrigger)) {
    throw new TypeError(
      'Could not have inferred the notification trigger type: if you want to use a time interval trigger, pass in only `seconds` with or without `repeats` property; if you want to use calendar-based trigger, pass in `second`.'
    );
  } else if ('seconds' in userFacingTrigger) {
    return {
      type: 'timeInterval',
      channelId: userFacingTrigger.channelId,
      seconds: userFacingTrigger.seconds,
      repeats: userFacingTrigger.repeats ?? false,
    };
  } else if (isCalendarTrigger(userFacingTrigger)) {
    const { repeats, ...calendarTrigger } = userFacingTrigger;
    return { type: 'calendar', value: calendarTrigger, repeats };
  } else {
    return Platform.select({
      default: null, // There's no notion of channels on platforms other than Android.
      android: { type: 'channel', channelId: userFacingTrigger.channelId },
    });
  }
}

function isCalendarTrigger(
  trigger: CalendarTriggerInput | ChannelAwareTriggerInput
): trigger is CalendarTriggerInput {
  const { channelId, ...triggerWithoutChannelId } = trigger;
  return Object.keys(triggerWithoutChannelId).length > 0;
}

function isDateTrigger(
  trigger:
    | DateTriggerInput
    | WeeklyTriggerInput
    | DailyTriggerInput
    | CalendarTriggerInput
    | TimeIntervalTriggerInput
): trigger is DateTriggerInput {
  return (
    trigger instanceof Date ||
    typeof trigger === 'number' ||
    (typeof trigger === 'object' && 'date' in trigger)
  );
}

function parseDateTrigger(trigger: DateTriggerInput): NativeNotificationTriggerInput {
  if (trigger instanceof Date || typeof trigger === 'number') {
    return { type: 'date', timestamp: toTimestamp(trigger) };
  }
  return { type: 'date', timestamp: toTimestamp(trigger.date), channelId: trigger.channelId };
}

function toTimestamp(date: number | Date) {
  if (date instanceof Date) {
    return date.getTime();
  }
  return date;
}

function isDailyTriggerInput(
  trigger: SchedulableNotificationTriggerInput
): trigger is DailyTriggerInput {
  if (typeof trigger !== 'object') return false;
  const { channelId, ...triggerWithoutChannelId } = trigger as DailyTriggerInput;
  return (
    Object.keys(triggerWithoutChannelId).length ===
      DAILY_TRIGGER_EXPECTED_DATE_COMPONENTS.length + 1 &&
    DAILY_TRIGGER_EXPECTED_DATE_COMPONENTS.every(
      (component) => component in triggerWithoutChannelId
    ) &&
    'repeats' in triggerWithoutChannelId &&
    triggerWithoutChannelId.repeats === true
  );
}

function isWeeklyTriggerInput(
  trigger: SchedulableNotificationTriggerInput
): trigger is WeeklyTriggerInput {
  if (typeof trigger !== 'object') return false;
  const { channelId, ...triggerWithoutChannelId } = trigger as WeeklyTriggerInput;
  return (
    Object.keys(triggerWithoutChannelId).length ===
      WEEKLY_TRIGGER_EXPECTED_DATE_COMPONENTS.length + 1 &&
    WEEKLY_TRIGGER_EXPECTED_DATE_COMPONENTS.every(
      (component) => component in triggerWithoutChannelId
    ) &&
    'repeats' in triggerWithoutChannelId &&
    triggerWithoutChannelId.repeats === true
  );
}

function isYearlyTriggerInput(
  trigger: SchedulableNotificationTriggerInput
): trigger is YearlyTriggerInput {
  if (typeof trigger !== 'object') return false;
  const { channelId, ...triggerWithoutChannelId } = trigger as YearlyTriggerInput;
  return (
    Object.keys(triggerWithoutChannelId).length ===
      YEARLY_TRIGGER_EXPECTED_DATE_COMPONENTS.length + 1 &&
    YEARLY_TRIGGER_EXPECTED_DATE_COMPONENTS.every(
      (component) => component in triggerWithoutChannelId
    ) &&
    'repeats' in triggerWithoutChannelId &&
    triggerWithoutChannelId.repeats === true
  );
}

function isSecondsPropertyMisusedInCalendarTriggerInput(
  trigger: TimeIntervalTriggerInput | CalendarTriggerInput
) {
  const { channelId, ...triggerWithoutChannelId } = trigger;
  return (
    // eg. { seconds: ..., repeats: ..., hour: ... }
    ('seconds' in triggerWithoutChannelId &&
      'repeats' in triggerWithoutChannelId &&
      Object.keys(triggerWithoutChannelId).length > 2) ||
    // eg. { seconds: ..., hour: ... }
    ('seconds' in triggerWithoutChannelId &&
      !('repeats' in triggerWithoutChannelId) &&
      Object.keys(triggerWithoutChannelId).length > 1)
  );
}

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
        const { day, month } = anyTriggerType;
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
