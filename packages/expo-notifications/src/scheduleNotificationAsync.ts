import { Platform } from '@unimodules/core';

import {
  IosNotificationRequestOptions,
  AndroidNotificationRequestOptions,
} from './NotificationPresenter.types';
import NotificationScheduler from './NotificationScheduler';
import {
  NativeCalendarTrigger,
  NativeNotificationTrigger,
  IosNotificationTrigger,
  AndroidNotificationTrigger,
} from './NotificationScheduler.types';
import { NotificationRequest } from './presentNotificationAsync';

export type CalendarTrigger = Omit<NativeCalendarTrigger['value'], 'type'> & { repeats?: boolean };
export interface TimeIntervalTrigger {
  repeats?: boolean;
  seconds: number;
}
export type DateTrigger = Date | number;
export type NotificationTrigger = (DateTrigger | TimeIntervalTrigger) & {
  ios?: IosNotificationTrigger;
  android?: AndroidNotificationTrigger;
};

type PlatformSpecificOptions = IosNotificationRequestOptions | AndroidNotificationRequestOptions;
export default async function scheduleNotificationAsync(
  identifier: string,
  notification: NotificationRequest,
  trigger: NotificationTrigger
): Promise<void> {
  // Remember current platform-specific options
  const platformSpecificOptions: PlatformSpecificOptions | undefined =
    notification[Platform.OS] ?? undefined;
  // Remove all known platform-specific options
  const { ios, android, ...baseRequest } = notification;
  // Merge current platform-specific options
  const easyBodyNotificationSpec = { ...baseRequest, ...platformSpecificOptions };
  // Stringify `body`
  const { body, ...restNotificationSpec } = easyBodyNotificationSpec;
  const notificationSpec = { ...restNotificationSpec, body: JSON.stringify(body) };

  return await NotificationScheduler.scheduleNotificationAsync(
    identifier,
    notificationSpec,
    parseTrigger(trigger[Platform.OS] ?? trigger)
  );
}

type NativeTrigger =
  | { type: 'interval'; value: number; repeats: boolean }
  | { type: 'date'; value: number }
  | { type: 'calendar'; value: CalendarTrigger };

function parseTrigger(
  userFacingTrigger: DateTrigger | TimeIntervalTrigger | CalendarTrigger
): NativeNotificationTrigger {
  if (userFacingTrigger instanceof Date) {
    return { type: 'date', value: userFacingTrigger.getTime() };
  } else if (typeof userFacingTrigger === 'number') {
    return { type: 'date', value: userFacingTrigger };
  } else if ('seconds' in userFacingTrigger) {
    return {
      type: 'interval',
      value: userFacingTrigger.seconds,
      repeats: userFacingTrigger.repeats ?? false,
    };
  } else {
    const { repeats, ...calendarTrigger } = userFacingTrigger;
    return { type: 'calendar', value: calendarTrigger, repeats };
  }
}
