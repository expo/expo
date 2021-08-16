import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelGroupManager from './NotificationChannelGroupManager';
import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';

export default async function getNotificationChannelGroupAsync(
  groupId: string
): Promise<NotificationChannelGroup | null> {
  if (!NotificationChannelGroupManager.getNotificationChannelGroupAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupAsync');
  }

  return await NotificationChannelGroupManager.getNotificationChannelGroupAsync(groupId);
}
