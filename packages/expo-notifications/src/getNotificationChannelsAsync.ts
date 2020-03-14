import { NotificationChannel } from './NotificationChannelManager.types';

export default async function getNotificationChannelsAsync(): Promise<NotificationChannel[]> {
  console.debug('Notification channels feature is only supported on Android.');
  return [];
}
