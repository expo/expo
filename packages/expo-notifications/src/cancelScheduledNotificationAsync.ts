import NotificationScheduler from './NotificationScheduler';

export default async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  return await NotificationScheduler.cancelScheduledNotificationAsync(identifier);
}
