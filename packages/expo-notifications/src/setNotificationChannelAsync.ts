import { NotificationChannel, NotificationChannelInput } from './NotificationChannelManager.types';

export default async function setNotificationChannelAsync(
  channelId: string,
  channel: NotificationChannelInput
): Promise<NotificationChannel | null> {
  console.debug('Notification channels feature is only supported on Android.');
  return null;
}
