import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelGroupManager from './NotificationChannelGroupManager';
import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';

export default async function getNotificationChannelGroupsAsync(): Promise<
  NotificationChannelGroup[]
> {
  if (!NotificationChannelGroupManager.getNotificationChannelGroupsAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupsAsync');
  }
  return await NotificationChannelGroupManager.getNotificationChannelGroupsAsync();
}
