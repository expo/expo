import { SharedObject } from 'expo';
import type { ReactNode } from 'react';

import type { after } from './Widgets';

/**
 * The rendering mode of the widget as provided by WidgetKit.
 * - `fullColor` — Home screen widgets (default).
 * - `accented` — Tinted widgets (iOS 18+) and watchOS.
 * - `vibrant` — Lock screen widgets.
 * @platform ios
 */
export type WidgetRenderingMode = 'fullColor' | 'accented' | 'vibrant';

/**
 * The level of detail the view is recommended to have.
 * The system can update the levelOfDetail value based on user proximity or other system specific factors and allow content customization adapting to show different levels of details.
 * - `simplified` — The system recommends showing a simplified view with less details.
 * - `default` — The system has no specific recommendation for the level of detail.
 * @platform iOS 26+
 */
export type LevelOfDetail = 'simplified' | 'default';

/**
 * The size family of the current Live Activity.
 * A Live Activity you initiate on one device can also appear on a remote device that renders the Live Activity in a different family size. As a result, it renders for a specific family, depending on both the device and the location in which it appears.
 * @platform iOS 18+
 */
export type ActivityFamily = 'small' | 'medium';

/**
 * The widget family (size).
 * - `systemSmall` - Small square widget (2x2 grid).
 * - `systemMedium` - Medium widget (4x2 grid).
 * - `systemLarge` - Large widget (4x4 grid).
 * - `systemExtraLarge` - Extra large widget (iPad only, 6x4 grid).
 * - `accessoryCircular` - Circular accessory widget for the Lock Screen.
 * - `accessoryRectangular` - Rectangular accessory widget for the Lock Screen.
 * - `accessoryInline` - Inline accessory widget for the Lock Screen.
 * @platform iOS
 */
export type WidgetFamily =
  | 'systemSmall'
  | 'systemMedium'
  | 'systemLarge'
  | 'systemExtraLarge'
  | 'accessoryCircular'
  | 'accessoryRectangular'
  | 'accessoryInline';

export type WidgetEnvironment<T extends object | undefined = undefined> = {
  /**
   * The date of this timeline entry.
   * @platform iOS
   */
  date?: Date;
  /**
   * The widget family.
   * @platform iOS
   */
  widgetFamily?: WidgetFamily;
  /**
   * The color scheme of the widget's environment.
   */
  colorScheme?: 'light' | 'dark';
  /**
   * A Boolean value that indicates whether the display or environment currently requires reduced luminance.
   *
   * When you detect this condition, lower the overall brightness of your view.
   * For example, you can change large, filled shapes to be stroked, and choose less bright colors.
   * @platform iOS 16+
   */
  isLuminanceReduced?: boolean;
  /**
   * The widget's rendering mode, based on where the system is displaying it.
   * @platform iOS 16+
   */
  widgetRenderingMode?: WidgetRenderingMode;
  /**
   * A Boolean value that indicates whether an accessory family widget can display an accessory label.
   * @platform iOS 16+
   */
  showsWidgetLabel?: boolean;
  /**
   * The content margins for the widget.
   * @platform iOS 17+
   */
  widgetContentMargins?: {
    top: number;
    bottom: number;
    leading: number;
    trailing: number;
  };
  /**
   * The level of detail the view is recommended to have.
   * @platform iOS 26+
   */
  levelOfDetail?: LevelOfDetail;
  /**
   * Widget configuration parameters.
   * @platform iOS 17+
   */
  configuration: T;
};

/**
 * @platform ios
 */
export type LiveActivityEnvironment = {
  /**
   * The color scheme of the activity's environment.
   * @platform ios
   */
  colorScheme: 'light' | 'dark';
  /**
   * Whether the activity is displayed in a context with reduced luminance.
   * @platform iOS 16+
   */
  isLuminanceReduced?: boolean;
  /**
   * Whether the activity is currently displayed in fullscreen.
   * @platform iOS 16.1+
   */
  isActivityFullscreen?: boolean;
  /**
   * Whether the activity's content is out of date, based on the `staleDate` passed to
   * `LiveActivityFactory.start()` or `LiveActivity.update()`.
   *
   * Use it to de-emphasize content the system can no longer vouch for. It becomes `true`
   * without the app running, so a Live Activity can degrade while the app is suspended.
   * @platform iOS 16.2+
   */
  isStale?: boolean;
  /**
   * The ActivityKit identifier of the Live Activity being drawn. It is the same value that
   * `LiveActivity.getId()` returns, so a layout can tell its activities apart.
   * @platform iOS 16.1+
   */
  activityId?: string;
  /**
   * A Boolean value that indicates whether the Live Activity update synchronization rate is reduced.
   * @platform iOS 18+
   */
  isActivityUpdateReduced?: boolean;
  /**
   * The size family of the current Live Activity.
   * @platform iOS 18+
   */
  activityFamily?: ActivityFamily;
  /**
   * The level of detail the view is recommended to have.
   * @platform iOS 26+
   */
  levelOfDetail?: LevelOfDetail;
};

/**
 * @platform ios
 */
export type WidgetTimelineEntry<T extends object = object> = {
  /**
   * Date when widget should update.
   */
  date: Date;
  /**
   * Props to be passed to the widget.
   */
  props: T;
};

export type WidgetConfigurationEnum = {
  /**
   * User-visible option label.
   */
  name: string;
  /**
   * Value available in `environment.configuration`.
   */
  value: string;
  /**
   * Optional secondary text displayed to user.
   * @platform iOS
   */
  subtitle?: string;
};

export type ExpoTimelineEntry = {
  timestamp: number;
  props: Record<string, any>;
};

/**
 * Defines the layout sections for an iOS Live Activity.
 * @platform ios
 */
export type LiveActivityLayout = {
  /**
   * The main banner content displayed in Notifications Center.
   */
  banner: ReactNode;
  /**
   * The small banner content displayed in CarPlay and WatchOS. Falls back to `banner` if not provided.
   */
  bannerSmall?: ReactNode;
  /**
   * The leading content in the compact Dynamic Island presentation.
   */
  compactLeading?: ReactNode;
  /**
   * The trailing content in the compact Dynamic Island presentation.
   */
  compactTrailing?: ReactNode;
  /**
   * The minimal content shown when the Dynamic Island is in its smallest form.
   */
  minimal?: ReactNode;
  /**
   * The center content in the expanded Dynamic Island presentation.
   */
  expandedCenter?: ReactNode;
  /**
   * The leading content in the expanded Dynamic Island presentation.
   */
  expandedLeading?: ReactNode;
  /**
   * The trailing content in the expanded Dynamic Island presentation.
   */
  expandedTrailing?: ReactNode;
  /**
   * The bottom content in the expanded Dynamic Island presentation.
   */
  expandedBottom?: ReactNode;
};

/**
 * A function that returns the layout for a Live Activity.
 * @platform ios
 */
export type LiveActivityComponent<T extends object = object> = (
  props: T,
  environment: LiveActivityEnvironment
) => LiveActivityLayout;

/**
 * Options for starting a Live Activity.
 * @platform ios
 */
export type LiveActivityStartOptions = {
  /**
   * The URL to open when the user taps the Live Activity.
   */
  url?: string;
  /**
   * The date when the system considers the activity's content out of date.
   */
  staleDate?: Date;
  /**
   * The activity's priority relative to other Live Activities from your app.
   * Higher scores take precedence in the Dynamic Island and on the Lock Screen.
   * @default 0
   */
  relevanceScore?: number;
  /**
   * When to start the activity and how to alert the user. Without it, the activity starts
   * immediately. Scheduling on an earlier version of iOS throws an error.
   * @platform iOS 26+
   */
  schedule?: LiveActivityScheduleOptions;
};

/**
 * Options for scheduling a Live Activity.
 * @platform iOS 26+
 */
export type LiveActivityScheduleOptions = {
  /** The future date when the activity should start. */
  startDate: Date;
  /** The alert the system presents when the activity starts. */
  alertConfiguration: LiveActivityAlertConfiguration;
};

/**
 * The alert the system presents when a scheduled Live Activity starts.
 * @platform iOS 26+
 */
export type LiveActivityAlertConfiguration = {
  /** The title of the alert. */
  title: string;
  /** The message to display in the alert. */
  body: string;
  /** The name of a sound file in the app bundle. Without it, the system plays its default sound. */
  sound?: string;
};

/**
 * Options for updating a Live Activity's content.
 * @platform ios
 */
export type LiveActivityUpdateOptions = {
  /** The date when the system considers the updated content out of date. */
  staleDate?: Date;
  /**
   * The updated activity's priority relative to other Live Activities from your app.
   * An update without this option resets the score to `0`.
   * @default 0
   */
  relevanceScore?: number;
  /**
   * The time the data in the update was generated. On iOS 17.2 and later, if this is older than a previous update or push payload, the system ignores this update.
   */
  contentDate?: Date;
};

/**
 * Event emitted when a user interacts with a widget.
 */
export type UserInteractionEvent = {
  /**
   * Widget that triggered the interaction.
   */
  source: string;
  /**
   * Button/toggle that was pressed.
   */
  target: string;
  /**
   * The key of the custom notification that contains the button. Absent for widget interactions.
   * @platform android
   */
  notificationId?: string;
  /**
   * Timestamp of the event.
   */
  timestamp: number;
  /**
   * The event type identifier.
   */
  type: 'ExpoWidgetsUserInteraction';
};

/**
 * Event emitted when a push token is received for a live activity.
 * @platform ios
 */
export type PushTokenEvent = {
  /**
   * The ID of the live activity.
   */
  activityId: string;
  /**
   * The push token for the live activity.
   */
  pushToken: string;
};

/**
 * Event emitted when a push-to-start token is received.
 * @platform ios
 */
export type PushToStartTokenEvent = {
  /**
   * The push-to-start token for starting live activities remotely.
   */
  activityPushToStartToken: string;
};

/**
 * Dismissal policy for ending a live activity.
 * - `'default'` - The system’s default dismissal policy for the Live Activity.
 * - `'immediate'` - The system immediately removes the Live Activity that ended.
 * - `after(date)` - The system removes the Live Activity that ended at the specified time within a four-hour window.
 * @platform ios
 */
export type LiveActivityDismissalPolicy = 'default' | 'immediate' | ReturnType<typeof after>;

/**
 * The current state of a Live Activity.
 * - `'pending'` - The Live Activity is scheduled to start at a specified date but hasn’t started yet. Available on iOS 26 and later.
 * - `'active'` - The Live Activity is active, visible, and can receive content updates.
 * - `'stale'` - The Live Activity content is out of date and needs an update.
 * - `'ended'` - The Live Activity is visible, but a person, the app, or the system ended it, and it won’t update its content anymore.
 * - `'dismissed'` - The Live Activity ended and is no longer visible because a person or the system removed it.
 * - `'unknown'` - A state that this version of Expo does not recognize.
 * @see [Apple's ActivityState documentation](https://developer.apple.com/documentation/activitykit/activitystate).
 * @platform ios
 */
export type LiveActivityState = 'pending' | 'active' | 'stale' | 'ended' | 'dismissed' | 'unknown';

/** @hidden */
export type ExpoWidgetsEvents = {
  /**
   * Function that is invoked when user interacts with a widget.
   * @param event Interaction event details.
   * @platform ios
   */
  onExpoWidgetsUserInteraction: (event: UserInteractionEvent) => void;
  /**
   * Function that is invoked when a push-to-start token is received.
   * @param event Token event details.
   * @platform ios
   */
  onExpoWidgetsPushToStartTokenReceived: (event: PushToStartTokenEvent) => void;
};

/**
 * @platform ios
 */
export type LiveActivityEvents = {
  /**
   * Function that is invoked when a push token is received for a live activity.
   * @param event Token event details.
   */
  onExpoWidgetsTokenReceived: (event: PushTokenEvent) => void;
};

export declare class NativeWidgetObject extends SharedObject {
  constructor(name: string, layout: string, initialProps?: Record<string, any>);
  reload(): void;
  updateSnapshot(props: Record<string, any>): void;
  updateTimeline(entries: ExpoTimelineEntry[]): void;
  getTimeline(): Promise<ExpoTimelineEntry[]>;
  setConfigurationParameterEnum(parameterName: string, options?: WidgetConfigurationEnum[]): void;
}

export type NativeLiveActivityStartOptions = Omit<
  LiveActivityStartOptions,
  'staleDate' | 'schedule'
> & {
  staleDate?: number;
  schedule?: Omit<LiveActivityScheduleOptions, 'startDate'> & { startDate: number };
};

export declare class NativeLiveActivityFactory extends SharedObject {
  constructor(name: string, layout: string);
  start(props: string, options: NativeLiveActivityStartOptions): NativeLiveActivity;
  getInstances(): NativeLiveActivity[];
}

export type NativeLiveActivityUpdateOptions = Omit<
  LiveActivityUpdateOptions,
  'staleDate' | 'contentDate'
> & {
  staleDate?: number;
  contentDate?: number;
};

export declare class NativeLiveActivity extends SharedObject<LiveActivityEvents> {
  getId(): string;
  getState(): LiveActivityState;
  update(props: string, options: NativeLiveActivityUpdateOptions): Promise<void>;
  end(
    dismissalPolicy?: string,
    afterDate?: number,
    state?: string,
    contentDate?: number
  ): Promise<void>;
  getPushToken(): Promise<string | null>;
}
