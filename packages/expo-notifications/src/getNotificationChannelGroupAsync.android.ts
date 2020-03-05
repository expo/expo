import { UnavailabilityError } from '@unimodules/core';

import NotificationChannelGroupManager, {
  NotificationChannelGroup,
} from './NotificationChannelGroupManager';

export default async function getNotificationChannelGroupAsync(
  groupId: string
): Promise<NotificationChannelGroup | null> {
  if (!NotificationChannelGroupManager.getNotificationChannelGroupAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupAsync');
  }

  return await NotificationChannelGroupManager.getNotificationChannelGroupAsync(groupId);
}
