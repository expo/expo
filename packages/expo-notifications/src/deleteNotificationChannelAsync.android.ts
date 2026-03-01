import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelManager from './NotificationChannelManager';

export async function deleteNotificationChannelAsync(channelId: string): Promise<void> {
  if (!NotificationChannelManager.deleteNotificationChannelAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationChannelAsync');
  }

  return await NotificationChannelManager.deleteNotificationChannelAsync(channelId);
}
