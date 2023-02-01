import { NotificationChannel } from './NotificationChannelManager.types';

/**
 * Fetches information about all known notification channels.
 * @return A Promise which resolves to an array of channels. On platforms that do not support notification channels,
 * it will always resolve to an empty array.
 * @platform android
 * @header channels
 */
export default async function getNotificationChannelsAsync(): Promise<NotificationChannel[]> {
  console.debug('Notification channels feature is only supported on Android.');
  return [];
}
