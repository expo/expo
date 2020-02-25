import { NativeCalendarTrigger, IosNotificationTrigger, AndroidNotificationTrigger } from './NotificationScheduler.types';
import { NotificationRequest } from './presentNotificationAsync';
export declare type CalendarTrigger = Omit<NativeCalendarTrigger['value'], 'type'> & {
    repeats?: boolean;
};
export interface TimeIntervalTrigger {
    repeats?: boolean;
    seconds: number;
}
export declare type DateTrigger = Date | number;
export declare type NotificationTrigger = (DateTrigger | TimeIntervalTrigger) & {
    ios?: IosNotificationTrigger;
    android?: AndroidNotificationTrigger;
};
export default function scheduleNotificationAsync(identifier: string, notification: NotificationRequest, trigger: NotificationTrigger): Promise<void>;
