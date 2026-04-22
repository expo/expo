import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelManager from './NotificationChannelManager';
import type { NotificationChannel } from './NotificationChannelManager.types';

export async function getNotificationChannelsAsync(): Promise<NotificationChannel[]> {
  if (!NotificationChannelManager.getNotificationChannelsAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelsAsync');
  }
  return (await NotificationChannelManager.getNotificationChannelsAsync()) ?? [];
}
