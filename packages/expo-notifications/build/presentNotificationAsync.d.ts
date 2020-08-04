import { NotificationContentInput } from './Notifications.types';
export default function presentNotificationAsync(content: NotificationContentInput, identifier?: string): Promise<string>;
