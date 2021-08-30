import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelManager from './NotificationChannelManager';
import { NotificationChannel } from './NotificationChannelManager.types';

export default async function getNotificationChannelAsync(
  channelId: string
): Promise<NotificationChannel | null> {
  if (!NotificationChannelManager.getNotificationChannelAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelAsync');
  }
  return await NotificationChannelManager.getNotificationChannelAsync(channelId);
}
