import { UnavailabilityError } from '@unimodules/core';

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
