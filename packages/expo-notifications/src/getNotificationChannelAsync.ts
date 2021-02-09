import { NotificationChannel } from './NotificationChannelManager.types';

export default async function getNotificationChannelAsync(
  channelId: string
): Promise<NotificationChannel | null> {
  console.debug('Notification channels feature is only supported on Android.');
  return null;
}
