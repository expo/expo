import { UnavailabilityError } from '@unimodules/core';

import NotificationChannelManager from './NotificationChannelManager';
import { NotificationChannel } from './NotificationChannelManager.types';

export default async function getNotificationChannelsAsync(): Promise<NotificationChannel[]> {
  if (!NotificationChannelManager.getNotificationChannelsAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelsAsync');
  }
  return (await NotificationChannelManager.getNotificationChannelsAsync()) ?? [];
}
