import { UnavailabilityError } from '@unimodules/core';

import NotificationChannelGroupManager, {
  NotificationChannelGroup,
} from './NotificationChannelGroupManager';

export default async function getNotificationChannelGroupsAsync(): Promise<
  NotificationChannelGroup[]
> {
  if (!NotificationChannelGroupManager.getNotificationChannelGroupsAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupsAsync');
  }
  return await NotificationChannelGroupManager.getNotificationChannelGroupsAsync();
}
