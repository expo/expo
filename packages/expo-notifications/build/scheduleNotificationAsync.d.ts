import { NotificationContentInput, NotificationTriggerInput } from './Notifications.types';
export default function scheduleNotificationAsync(content: NotificationContentInput, trigger: NotificationTriggerInput, identifier?: string): Promise<string>;
