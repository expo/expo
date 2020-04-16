export interface CalendarTriggerInput {
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
export interface TimeIntervalTriggerInput {
    type: 'timeInterval';
    repeats: boolean;
    seconds: number;
}
export interface DateTriggerInput {
    type: 'date';
    timestamp: number;
}
export declare type NotificationTriggerInput = null | DateTriggerInput | CalendarTriggerInput | TimeIntervalTriggerInput;
