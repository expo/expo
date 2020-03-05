import { UnavailabilityError } from '@unimodules/core';

import NotificationChannelManager, {
  NotificationChannelInput,
  NotificationChannel,
} from './NotificationChannelManager';

export default async function setNotificationChannelAsync(
  channelId: string,
  channel: NotificationChannelInput
): Promise<NotificationChannel | null> {
  if (!NotificationChannelManager.setNotificationChannelAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationChannelAsync');
  }

  return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);
}
