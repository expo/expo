import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelManager from './NotificationChannelManager';
import { NotificationChannelInput, NotificationChannel } from './NotificationChannelManager.types';

export default async function setNotificationChannelAsync(
  channelId: string,
  channel: NotificationChannelInput
): Promise<NotificationChannel | null> {
  if (!NotificationChannelManager.setNotificationChannelAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationChannelAsync');
  }

  return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);
}
