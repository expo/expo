/**
 * An object which represents a notification delivered by a push notification system.
 *
 * On Android under `remoteMessage` field a JS version of the Firebase `RemoteMessage` may be accessed.
 * On iOS under `payload` you may find full contents of [`UNNotificationContent`'s](https://developer.apple.com/documentation/usernotifications/unnotificationcontent?language=objc) [`userInfo`](https://developer.apple.com/documentation/usernotifications/unnotificationcontent/1649869-userinfo?language=objc), for example [remote notification payload](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html).
 */
export type PushNotificationTrigger = {
    type: 'push';
    /**
     * @platform ios
     */
    payload?: Record<string, unknown>;
    /**
     * @platform android
     */
    remoteMessage?: FirebaseRemoteMessage;
};
/**
 * A trigger related to a [`UNCalendarNotificationTrigger`](https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger?language=objc).
 * @platform ios
 */
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
/**
 * The region used to determine when the system sends the notification.
 * @platform ios
 */
export interface Region {
    type: string;
    /**
     * The identifier for the region object.
     */
    identifier: string;
    /**
     * Indicates whether notifications are generated upon entry into the region.
     */
    notifyOnEntry: boolean;
    /**
     * Indicates whether notifications are generated upon exit from the region.
     */
    notifyOnExit: boolean;
}
/**
 * A circular geographic region, specified as a center point and radius. Based on Core Location [`CLCircularRegion`](https://developer.apple.com/documentation/corelocation/clcircularregion) class.
 * @platform ios
 */
export interface CircularRegion extends Region {
    type: 'circular';
    /**
     * The radius (measured in meters) that defines the geographic area’s outer boundary.
     */
    radius: number;
    /**
     * The center point of the geographic area.
     */
    center: {
        latitude: number;
        longitude: number;
    };
}
/**
 * A region used to detect the presence of iBeacon devices. Based on Core Location [`CLBeaconRegion`](https://developer.apple.com/documentation/corelocation/clbeaconregion) class.
 * @platform ios
 */
export interface BeaconRegion extends Region {
    type: 'beacon';
    /**
     * A Boolean value that indicates whether Core Location sends beacon notifications when the device’s display is on.
     */
    notifyEntryStateOnDisplay: boolean;
    /**
     * The major value from the beacon identity constraint that defines the beacon region.
     */
    major: number | null;
    /**
     * The minor value from the beacon identity constraint that defines the beacon region.
     */
    minor: number | null;
    /**
     * The UUID value from the beacon identity constraint that defines the beacon region.
     */
    uuid?: string;
    /**
     * The beacon identity constraint that defines the beacon region.
     */
    beaconIdentityConstraint?: {
        uuid: string;
        major: number | null;
        minor: number | null;
    };
}
/**
 * A trigger related to a [`UNLocationNotificationTrigger`](https://developer.apple.com/documentation/usernotifications/unlocationnotificationtrigger?language=objc).
 * @platform ios
 */
export interface LocationNotificationTrigger {
    type: 'location';
    repeats: boolean;
    region: CircularRegion | BeaconRegion;
}
/**
 * A trigger related to an elapsed time interval. May be repeating (see `repeats` field).
 */
export interface TimeIntervalNotificationTrigger {
    type: 'timeInterval';
    repeats: boolean;
    seconds: number;
}
/**
 * A trigger related to a daily notification.
 * > The same functionality will be achieved on iOS with a `CalendarNotificationTrigger`.
 * @platform android
 */
export interface DailyNotificationTrigger {
    type: 'daily';
    hour: number;
    minute: number;
}
/**
 * A trigger related to a weekly notification.
 * > The same functionality will be achieved on iOS with a `CalendarNotificationTrigger`.
 * @platform android
 */
export interface WeeklyNotificationTrigger {
    type: 'weekly';
    weekday: number;
    hour: number;
    minute: number;
}
/**
 * A trigger related to a monthly notification.
 * > The same functionality will be achieved on iOS with a `CalendarNotificationTrigger`.
 * @platform android
 */
export interface MonthlyNotificationTrigger {
    type: 'monthly';
    day: number;
    hour: number;
    minute: number;
}
/**
 * A trigger related to a yearly notification.
 * > The same functionality will be achieved on iOS with a `CalendarNotificationTrigger`.
 * @platform android
 */
export interface YearlyNotificationTrigger {
    type: 'yearly';
    day: number;
    month: number;
    hour: number;
    minute: number;
}
/**
 * A Firebase `RemoteMessage` that caused the notification to be delivered to the app.
 */
export interface FirebaseRemoteMessage {
    collapseKey: string | null;
    data: Record<string, string>;
    from: string | null;
    messageId: string | null;
    messageType: string | null;
    originalPriority: number;
    priority: number;
    sentTime: number;
    to: string | null;
    ttl: number;
    notification: null | FirebaseRemoteMessageNotification;
}
export interface FirebaseRemoteMessageNotification {
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
}
/**
 * Represents a notification trigger that is unknown to `expo-notifications` and that it didn't know how to serialize for JS.
 */
export interface UnknownNotificationTrigger {
    type: 'unknown';
}
/**
 * A union type containing different triggers which may cause the notification to be delivered to the application.
 */
export type NotificationTrigger = PushNotificationTrigger | LocationNotificationTrigger | NotificationTriggerInput | UnknownNotificationTrigger;
/**
 * A trigger that will cause the notification to be delivered immediately.
 */
export type ChannelAwareTriggerInput = {
    channelId: string;
};
/**
 * Schedulable trigger inputs (that are not a plain date value or time value)
 * must have the "type" property set to one of these values.
 */
export declare enum SchedulableTriggerInputTypes {
    CALENDAR = "calendar",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly",
    DATE = "date",
    TIME_INTERVAL = "timeInterval"
}
/**
 * This trigger input will cause the notification to be delivered once or many times
 * (controlled by the value of `repeats`)
 * when the date components match the specified values.
 * Corresponds to native
 * [`UNCalendarNotificationTrigger`](https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger?language=objc).
 * @platform ios
 */
export type CalendarTriggerInput = {
    type: SchedulableTriggerInputTypes.CALENDAR;
    channelId?: string;
    repeats?: boolean;
    seconds?: number;
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
/**
 * This trigger input will cause the notification to be delivered once per day
 * when the `hour` and `minute` date components match the specified values.
 */
export type DailyTriggerInput = {
    type: SchedulableTriggerInputTypes.DAILY;
    channelId?: string;
    hour: number;
    minute: number;
};
/**
 * This trigger input will cause the notification to be delivered once every week
 * when the `weekday`, `hour`, and `minute` date components match the specified values.
 * > **Note:** Weekdays are specified with a number from `1` through `7`, with `1` indicating Sunday.
 */
export type WeeklyTriggerInput = {
    type: SchedulableTriggerInputTypes.WEEKLY;
    channelId?: string;
    weekday: number;
    hour: number;
    minute: number;
};
/**
 * This trigger input will cause the notification to be delivered once per month
 * when the `day`, `hour`, and `minute` date components match the specified values.
 * > **Note:** All properties are specified in JavaScript `Date` object's ranges (i.e. January is represented as 0).
 */
export type MonthlyTriggerInput = {
    type: SchedulableTriggerInputTypes.MONTHLY;
    channelId?: string;
    day: number;
    hour: number;
    minute: number;
};
/**
 * This trigger input will cause the notification to be delivered once every year
 * when the `day`, `month`, `hour`, and `minute` date components match the specified values.
 * > **Note:** All properties are specified in JavaScript `Date` object's ranges (i.e. January is represented as 0).
 */
export type YearlyTriggerInput = {
    type: SchedulableTriggerInputTypes.YEARLY;
    channelId?: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
};
/**
 * This trigger input will cause the notification to be delivered once
 * on the specified value of the `date` property. The value of `repeats` will be ignored
 * for this trigger type.
 */
export type DateTriggerInput = Date | number | {
    type: SchedulableTriggerInputTypes.DATE;
    channelId?: string;
    date: Date | number;
};
/**
 * This trigger input will cause the notification to be delivered once or many times
 * (depends on the `repeats` field) after `seconds` time elapse.
 * > **On iOS**, when `repeats` is `true`, the time interval must be 60 seconds or greater.
 * Otherwise, the notification won't be triggered.
 */
export type TimeIntervalTriggerInput = {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL;
    channelId?: string;
    repeats?: boolean;
    seconds: number;
};
/**
 * Input for time-based, schedulable triggers.
 * For these triggers you can check the next trigger date with [`getNextTriggerDateAsync`](#getnexttriggerdateasynctrigger).
 * If you pass in a `number` (Unix timestamp) or `Date`, it will be processed as a
 * trigger input of type [`SchedulableTriggerInputTypes.DATE`](#date). Otherwise, the input must be
 * an object, with a `type` value set to one of the allowed values in [`SchedulableTriggerInputTypes`](#schedulabletriggerinputtypes).
 * If the input is an object, date components passed in will be validated, and
 * an error is thrown if they are outside their allowed range (for example, the `minute` and
 * `second` components must be between 0 and 59 inclusive).
 */
export type SchedulableNotificationTriggerInput = CalendarTriggerInput | TimeIntervalTriggerInput | DailyTriggerInput | WeeklyTriggerInput | MonthlyTriggerInput | YearlyTriggerInput | DateTriggerInput;
/**
 * A type which represents possible triggers with which you can schedule notifications.
 * A `null` trigger means that the notification should be scheduled for delivery immediately.
 */
export type NotificationTriggerInput = null | ChannelAwareTriggerInput | SchedulableNotificationTriggerInput;
/**
 * An enum corresponding to values appropriate for Android's [`Notification#priority`](https://developer.android.com/reference/android/app/Notification#priority) field.
 * @platform android
 */
export declare enum AndroidNotificationPriority {
    MIN = "min",
    LOW = "low",
    DEFAULT = "default",
    HIGH = "high",
    MAX = "max"
}
/**
 * An object represents notification's content.
 */
export type NotificationContent = {
    /**
     * Notification title - the bold text displayed above the rest of the content.
     */
    title: string | null;
    /**
     * On Android: `subText` - the display depends on the device.
     *
     * On iOS: `subtitle` - the bold text displayed between title and the rest of the content.
     */
    subtitle: string | null;
    /**
     * Notification body - the main content of the notification.
     */
    body: string | null;
    /**
     * Data associated with the notification, not displayed
     */
    data: Record<string, any>;
    sound: 'default' | 'defaultCritical' | 'custom' | null;
} & (NotificationContentIos | NotificationContentAndroid);
/**
 * See [Apple documentation](https://developer.apple.com/documentation/usernotifications/unnotificationcontent?language=objc) for more information on specific fields.
 */
export type NotificationContentIos = {
    /**
     * The name of the image or storyboard to use when your app launches because of the notification.
     */
    launchImageName: string | null;
    /**
     * The number that your app’s icon displays.
     */
    badge: number | null;
    /**
     * The visual and audio attachments to display alongside the notification’s main content.
     */
    attachments: NotificationContentAttachmentIos[];
    /**
     * The text the system adds to the notification summary to provide additional context.
     */
    summaryArgument?: string | null;
    /**
     * The number the system adds to the notification summary when the notification represents multiple items.
     */
    summaryArgumentCount?: number;
    /**
     * The identifier of the notification’s category.
     */
    categoryIdentifier: string | null;
    /**
     * The identifier that groups related notifications.
     */
    threadIdentifier: string | null;
    /**
     * The value your app uses to determine which scene to display to handle the notification.
     */
    targetContentIdentifier?: string;
    /**
     * The notification’s importance and required delivery timing.
     * Possible values:
     * - 'passive' - the system adds the notification to the notification list without lighting up the screen or playing a sound
     * - 'active' - the system presents the notification immediately, lights up the screen, and can play a sound
     * - 'timeSensitive' - The system presents the notification immediately, lights up the screen, can play a sound, and breaks through system notification controls
     * - 'critical - the system presents the notification immediately, lights up the screen, and bypasses the mute switch to play a sound
     * @platform ios
     */
    interruptionLevel?: 'passive' | 'active' | 'timeSensitive' | 'critical';
};
/**
 * @platform ios
 */
export type NotificationContentAttachmentIos = {
    identifier: string | null;
    url: string | null;
    type: string | null;
    typeHint?: string;
    hideThumbnail?: boolean;
    thumbnailClipArea?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    thumbnailTime?: number;
};
/**
 * See [Android developer documentation](https://developer.android.com/reference/android/app/Notification#fields) for more information on specific fields.
 */
export type NotificationContentAndroid = {
    /**
     * Application badge number associated with the notification.
     */
    badge?: number;
    /**
     * Accent color (in `#AARRGGBB` or `#RRGGBB` format) to be applied by the standard Style templates when presenting this notification.
     */
    color?: string;
    /**
     * Relative priority for this notification. Priority is an indication of how much of the user's valuable attention should be consumed by this notification.
     * Low-priority notifications may be hidden from the user in certain situations, while the user might be interrupted for a higher-priority notification.
     * The system will make a determination about how to interpret this priority when presenting the notification.
     */
    priority?: AndroidNotificationPriority;
    /**
     * The pattern with which to vibrate.
     */
    vibrationPattern?: number[];
};
/**
 * An object represents a request to present a notification. It has content — how it's being represented, and a trigger — what triggers the notification.
 * Many notifications ([`Notification`](#notification)) may be triggered with the same request (for example, a repeating notification).
 */
export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: NotificationTrigger;
}
/**
 * An object which represents notification content that you pass in to `presentNotificationAsync` or as a part of `NotificationRequestInput`.
 */
export type NotificationContentInput = {
    /**
     * Notification title - the bold text displayed above the rest of the content.
     */
    title?: string | null;
    /**
     * On Android: `subText` - the display depends on the device.
     *
     * On iOS: `subtitle` - the bold text displayed between title and the rest of the content.
     */
    subtitle?: string | null;
    /**
     * The main content of the notification.
     */
    body?: string | null;
    /**
     * Data associated with the notification, not displayed.
     */
    data?: Record<string, any>;
    /**
     * Application badge number associated with the notification.
     */
    badge?: number;
    sound?: boolean | string;
    /**
     * The name of the image or storyboard to use when your app launches because of the notification.
     */
    launchImageName?: string;
    /**
     * The pattern with which to vibrate.
     * @platform android
     */
    vibrate?: number[];
    /**
     * Relative priority for this notification. Priority is an indication of how much of the user's valuable attention should be consumed by this notification.
     * Low-priority notifications may be hidden from the user in certain situations, while the user might be interrupted for a higher-priority notification.
     * The system will make a determination about how to interpret this priority when presenting the notification.
     * @platform android
     */
    priority?: string;
    /**
     * Accent color (in `#AARRGGBB` or `#RRGGBB` format) to be applied by the standard Style templates when presenting this notification.
     * @platform android
     */
    color?: string;
    /**
     * If set to `false`, the notification will not be automatically dismissed when clicked.
     * The setting will be used when the value is not provided or is invalid is set to `true`, and the notification
     * will be dismissed automatically anyway. Corresponds directly to Android's `setAutoCancel` behavior.
     *
     * See [Android developer documentation](https://developer.android.com/reference/android/app/Notification.Builder#setAutoCancel(boolean))
     * for more details.
     * @platform android
     */
    autoDismiss?: boolean;
    /**
     * The identifier of the notification’s category.
     * @platform ios
     */
    categoryIdentifier?: string;
    /**
     * If set to `true`, the notification cannot be dismissed by swipe. This setting defaults
     * to `false` if not provided or is invalid. Corresponds directly do Android's `isOngoing` behavior.
     * In Firebase terms this property of a notification is called `sticky`.
     *
     * See [Android developer documentation](https://developer.android.com/reference/android/app/Notification.Builder#setOngoing(boolean))
     * and [Firebase documentation](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#AndroidNotification.FIELDS.sticky)
     * for more details.
     * @platform android
     */
    sticky?: boolean;
    /**
     * The visual and audio attachments to display alongside the notification’s main content.
     * @platform ios
     */
    attachments?: NotificationContentAttachmentIos[];
    interruptionLevel?: 'passive' | 'active' | 'timeSensitive' | 'critical';
};
/**
 * An object which represents a notification request you can pass into `scheduleNotificationAsync`.
 */
export interface NotificationRequestInput {
    identifier?: string;
    content: NotificationContentInput;
    trigger: NotificationTriggerInput;
}
/**
 * An object which represents a single notification that has been triggered by some request ([`NotificationRequest`](#notificationrequest)) at some point in time.
 */
export interface Notification {
    date: number;
    request: NotificationRequest;
}
/**
 * An object which represents user's interaction with the notification.
 * > **Note:** If the user taps on a notification `actionIdentifier` will be equal to [`Notifications.DEFAULT_ACTION_IDENTIFIER`](#notificationsdefault_action_identifier).
 */
export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
    userText?: string;
}
/**
 * An object which represents behavior that should be applied to the incoming notification.
 * > On Android, setting `shouldPlaySound: false` will result in the drop-down notification alert **not** showing, no matter what the priority is.
 * > This setting will also override any channel-specific sounds you may have configured.
 */
export interface NotificationBehavior {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    priority?: AndroidNotificationPriority;
}
export interface NotificationAction {
    /**
     * A unique string that identifies this action. If a user takes this action (for example, selects this button in the system's Notification UI),
     * your app will receive this `actionIdentifier` via the [`NotificationResponseReceivedListener`](#addnotificationresponsereceivedlistenerlistener).
     */
    identifier: string;
    /**
     * The title of the button triggering this action.
     */
    buttonTitle: string;
    /**
     * Object which, if provided, will result in a button that prompts the user for a text response.
     */
    textInput?: {
        /**
         * A string which will be used as the title for the button used for submitting the text response.
         * @platform ios
         */
        submitButtonTitle: string;
        /**
         * A string that serves as a placeholder until the user begins typing. Defaults to no placeholder string.
         */
        placeholder: string;
    };
    /**
     * Object representing the additional configuration options.
     */
    options?: {
        /**
         * Boolean indicating whether the button title will be highlighted a different color (usually red).
         * This usually signifies a destructive action such as deleting data.
         * @platform ios
         */
        isDestructive?: boolean;
        /**
         * Boolean indicating whether triggering the action will require authentication from the user.
         * @platform ios
         */
        isAuthenticationRequired?: boolean;
        /**
         * Boolean indicating whether triggering this action foregrounds the app.
         * If `false` and your app is killed (not just backgrounded), [`NotificationResponseReceived` listeners](#addnotificationresponsereceivedlistenerlistener)
         * will not be triggered when a user selects this action.
         * @default true
         */
        opensAppToForeground?: boolean;
    };
}
export interface NotificationCategory {
    identifier: string;
    actions: NotificationAction[];
    options?: NotificationCategoryOptions;
}
/**
 * @platform ios
 */
export type NotificationCategoryOptions = {
    /**
     * Customizable placeholder for the notification preview text. This is shown if the user has disabled notification previews for the app.
     * Defaults to the localized iOS system default placeholder (`Notification`).
     */
    previewPlaceholder?: string;
    /**
     * Array of [Intent Class Identifiers](https://developer.apple.com/documentation/sirikit/intent_class_identifiers). When a notification is delivered,
     * the presence of an intent identifier lets the system know that the notification is potentially related to the handling of a request made through Siri.
     * @default []
     */
    intentIdentifiers?: string[];
    /**
     * A format string for the summary description used when the system groups the category’s notifications.
     */
    categorySummaryFormat?: string;
    /**
     * Indicates whether to send actions for handling when the notification is dismissed (the user must explicitly dismiss
     * the notification interface - ignoring a notification or flicking away a notification banner does not trigger this action).
     * @default false
     */
    customDismissAction?: boolean;
    /**
     * Indicates whether to allow CarPlay to display notifications of this type. **Apps must be approved for CarPlay to make use of this feature.**
     * @default false
     */
    allowInCarPlay?: boolean;
    /**
     * Indicates whether to show the notification's title, even if the user has disabled notification previews for the app.
     * @default false
     */
    showTitle?: boolean;
    /**
     * Indicates whether to show the notification's subtitle, even if the user has disabled notification previews for the app.
     * @default false
     */
    showSubtitle?: boolean;
    /**
     * Indicates whether to allow notifications to be automatically read by Siri when the user is using AirPods.
     * @default false
     */
    allowAnnouncement?: boolean;
};
export type MaybeNotificationResponse = NotificationResponse | null | undefined;
export { PermissionExpiration, PermissionResponse, EventSubscription, PermissionStatus, } from 'expo-modules-core';
//# sourceMappingURL=Notifications.types.d.ts.map