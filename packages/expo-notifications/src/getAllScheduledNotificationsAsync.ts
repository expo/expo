import NotificationScheduler from './NotificationScheduler';
import { NotificationRequest } from './Notifications.types';

export default async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> {
  return await NotificationScheduler.getAllScheduledNotificationsAsync();
}
