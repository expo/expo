import NotificationScheduler from './NotificationScheduler';
import { Notification } from './NotificationsEmitter.types';

export default async function getAllScheduledNotificationsAsync(): Promise<Notification[]> {
  return await NotificationScheduler.getAllScheduledNotificationsAsync();
}
