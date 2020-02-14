interface BaseNotificationTrigger {
    type: string;
    class: string;
    repeats: boolean;
}
interface PushNotificationTrigger extends BaseNotificationTrigger {
    type: 'push';
}
interface CalendarNotificationTrigger extends BaseNotificationTrigger {
    type: 'calendar';
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
interface CircularRegion extends Region {
    type: 'circular';
    radius: number;
    center: {
        latitude: number;
        longitude: number;
    };
}
interface BeaconRegion extends Region {
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
interface LocationNotificationTrigger extends BaseNotificationTrigger {
    type: 'location';
    region: CircularRegion | BeaconRegion;
}
interface TimeIntervalNotificationTrigger extends BaseNotificationTrigger {
    type: 'timeInterval';
    timeInterval: number;
}
declare type NotificationTrigger = PushNotificationTrigger | CalendarNotificationTrigger | LocationNotificationTrigger | TimeIntervalNotificationTrigger;
interface IosNotification {
    request: {
        identifier: string;
        content: {
            title: string | null;
            subtitle: string | null;
            body: string | null;
            badge: number | null;
            sound: string | null;
            launchImageName: string;
            userInfo: {
                [key: string]: unknown;
            };
            attachments: {
                identifier: string | null;
                url: string | null;
                type: string | null;
            }[];
            summaryArgument: string;
            summaryArgumentCount: number;
            categoryIdentifier: string;
            threadIdentifier: string;
            targetContentIdentifier?: string;
        };
        trigger: NotificationTrigger;
    };
    date: number;
}
interface AndroidNotification {
    collapseKey: string | null;
    data: {
        [key: string]: string;
    };
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
export declare type Notification = IosNotification | AndroidNotification;
export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
    userText?: string;
}
export {};
