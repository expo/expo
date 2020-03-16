// ISO8601 calendar pattern-matching
export interface NativeCalendarTrigger {
  type: 'calendar';
  repeats?: boolean;
  value: {
    timezone?: string;

    year?: number;
    month?: number;
    weekday?: number;
    weekOfMonth?: number;
    weekOfYear?: number;
    weekdayOrdinal?: number;
    day?: number;

    hour?: number;
    minute?: number;
    second?: number;
  };
}

export interface NativeTimeIntervalTrigger {
  type: 'interval';
  repeats?: boolean;
  value: number;
}

export type NativeDateTrigger = {
  type: 'date';
  value: number; // seconds since 1970
};

export type IosNotificationTrigger =
  | null
  | NativeTimeIntervalTrigger
  | NativeDateTrigger
  | NativeCalendarTrigger;
export type AndroidNotificationTrigger = NativeTimeIntervalTrigger | NativeDateTrigger | null;
export type NativeNotificationTrigger = IosNotificationTrigger | AndroidNotificationTrigger;
