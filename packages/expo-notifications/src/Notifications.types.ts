import { CalendarTriggerInput as NativeCalendarTriggerInput } from './NotificationScheduler.types';

/**
 * `payload` is set only on iOS,
 * `remoteMessage` is set only on Android,
 * no extra entry is for Web
 */
export type PushNotificationTrigger = { type: 'push' } & (
  | { payload: Record<string, unknown> }
  | { remoteMessage: FirebaseRemoteMessage }
  // eslint-disable-next-line @typescript-eslint/ban-types
  | {}
);

export interface CalendarNotificationTrigger {
  type: 'calendar';
  repeats: boolean;
  dateComponents: {
    era?: number;
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    weekday?: number;
    weekdayOrdinal?: number;
    quarter?: number;
    weekOfMonth?: number;
    weekOfYear?: number;
    yearForWeekOfYear?: number;
    nanosecond?: number;
    isLeapMonth: boolean;
    timeZone?: string;
    calendar?: string;
  };
}

interface Region {
  type: string;
  identifier: string;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}

export interface CircularRegion extends Region {
  type: 'circular';
  radius: number;
  center: {
    latitude: number;
    longitude: number;
  };
}

export interface BeaconRegion extends Region {
  type: 'beacon';
  notifyEntryStateOnDisplay: boolean;
  major: number | null;
  minor: number | null;
  uuid?: string;
  beaconIdentityConstraint?: {
    uuid: string;
    major: number | null;
    minor: number | null;
  };
}

export interface LocationNotificationTrigger {
  type: 'location';
  repeats: boolean;
  region: CircularRegion | BeaconRegion;
}

export interface TimeIntervalNotificationTrigger {
  type: 'timeInterval';
  repeats: boolean;
  seconds: number;
}

export interface DailyNotificationTrigger {
  type: 'daily';
  hour: number;
  minute: number;
}

export interface WeeklyNotificationTrigger {
  type: 'weekly';
  weekday: number;
  hour: number;
  minute: number;
}

export interface YearlyNotificationTrigger {
  type: 'yearly';
  day: number;
  month: number;
  hour: number;
  minute: number;
}

export interface FirebaseRemoteMessage {
  collapseKey: string | null;
  data: { [key: string]: string };
  from: string | null;
  messageId: string | null;
  messageType: string | null;
  originalPriority: number;
  priority: number;
  sentTime: number;
  to: string | null;
  ttl: number;
  notification: null | {
    body: string | null;
    bodyLocalizationArgs: string[] | null;
    bodyLocalizationKey: string | null;
    channelId: string | null;
    clickAction: string | null;
    color: string | null;
    usesDefaultLightSettings: boolean;
    usesDefaultSound: boolean;
    usesDefaultVibrateSettings: boolean;
    eventTime: number | null;
    icon: string | null;
    imageUrl: string | null;
    lightSettings: number[] | null;
    link: string | null;
    localOnly: boolean;
    notificationCount: number | null;
    notificationPriority: number | null;
    sound: string | null;
    sticky: boolean;
    tag: string | null;
    ticker: string | null;
    title: string | null;
    titleLocalizationArgs: string[] | null;
    titleLocalizationKey: string | null;
    vibrateTimings: number[] | null;
    visibility: number | null;
  };
}

export interface UnknownNotificationTrigger {
  type: 'unknown';
}

export type NotificationTrigger =
  | PushNotificationTrigger
  | CalendarNotificationTrigger
  | LocationNotificationTrigger
  | TimeIntervalNotificationTrigger
  | DailyNotificationTrigger
  | WeeklyNotificationTrigger
  | YearlyNotificationTrigger
  | UnknownNotificationTrigger;

export type ChannelAwareTriggerInput = {
  channelId: string;
};

export type CalendarTriggerInput = NativeCalendarTriggerInput['value'] & {
  channelId?: string;
  repeats?: boolean;
};
export interface TimeIntervalTriggerInput {
  channelId?: string;
  repeats?: boolean;
  seconds: number;
}
export interface DailyTriggerInput {
  channelId?: string;
  hour: number;
  minute: number;
  repeats: true;
}

export interface WeeklyTriggerInput {
  channelId?: string;
  weekday: number;
  hour: number;
  minute: number;
  repeats: true;
}

export interface YearlyTriggerInput {
  channelId?: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  repeats: true;
}

export type DateTriggerInput = Date | number | { channelId?: string; date: Date | number };

export type SchedulableNotificationTriggerInput =
  | DateTriggerInput
  | TimeIntervalTriggerInput
  | DailyTriggerInput
  | WeeklyTriggerInput
  | YearlyTriggerInput
  | CalendarTriggerInput;

export type NotificationTriggerInput =
  | null
  | ChannelAwareTriggerInput
  | SchedulableNotificationTriggerInput;

export enum AndroidNotificationPriority {
  MIN = 'min',
  LOW = 'low',
  DEFAULT = 'default',
  HIGH = 'high',
  MAX = 'max',
}

export type NotificationContent = {
  title: string | null;
  subtitle: string | null;
  body: string | null;
  data: { [key: string]: unknown };
  sound: 'default' | 'defaultCritical' | 'custom' | null;
} & (
  | {
      launchImageName: string | null;
      badge: number | null;
      attachments: {
        identifier: string | null;
        url: string | null;
        type: string | null;
      }[];
      summaryArgument?: string | null;
      summaryArgumentCount?: number;
      categoryIdentifier: string | null;
      threadIdentifier: string | null;
      targetContentIdentifier?: string;
    }
  | {
      badge?: number;
      /**
       * Format: '#AARRGGBB'
       */
      color?: string;
      priority?: AndroidNotificationPriority;
      vibrationPattern?: number[];
    }
);

export interface NotificationRequest {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
}

export interface NotificationContentInput {
  title?: string;
  subtitle?: string;
  body?: string;
  data?: { [key: string]: unknown };
  badge?: number;
  sound?: boolean | string;
  launchImageName?: string;
  vibrate?: number[];
  priority?: string;
  /**
   * Format: '#AARRGGBB', '#RRGGBB' or one of the named colors,
   * see https://developer.android.com/reference/kotlin/android/graphics/Color?hl=en
   */
  color?: string;
  autoDismiss?: boolean;
  categoryIdentifier?: string;
  sticky?: boolean;
  attachments?: {
    url: string;
    identifier?: string;

    typeHint?: string;
    hideThumbnail?: boolean;
    thumbnailClipArea?: { x: number; y: number; width: number; height: number };
    thumbnailTime?: number;
  }[];
}

export interface NotificationRequestInput {
  identifier?: string;
  content: NotificationContentInput;
  trigger: NotificationTriggerInput;
}

export interface Notification {
  date: number;
  request: NotificationRequest;
}

export interface NotificationResponse {
  notification: Notification;
  actionIdentifier: string;
  userText?: string;
}

export interface NotificationBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  priority?: AndroidNotificationPriority;
}

export interface NotificationAction {
  identifier: string;
  buttonTitle: string;
  textInput?: {
    submitButtonTitle: string;
    placeholder: string;
  };
  options?: {
    isDestructive?: boolean;
    isAuthenticationRequired?: boolean;
    opensAppToForeground?: boolean;
  };
}

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  options?: {
    previewPlaceholder?: string;
    intentIdentifiers?: string[];
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    allowAnnouncement?: boolean;
  };
}
