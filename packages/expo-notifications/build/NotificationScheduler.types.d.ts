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
export declare type NativeDateTrigger = {
    type: 'date';
    value: number;
};
export declare type IosNotificationTrigger = null | NativeTimeIntervalTrigger | NativeDateTrigger | NativeCalendarTrigger;
export declare type AndroidNotificationTrigger = NativeTimeIntervalTrigger | NativeDateTrigger | null;
export declare type NativeNotificationTrigger = IosNotificationTrigger | AndroidNotificationTrigger;
