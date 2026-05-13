import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelGroupManager from './NotificationChannelGroupManager';

export async function deleteNotificationChannelGroupAsync(groupId: string): Promise<void> {
  if (!NotificationChannelGroupManager.deleteNotificationChannelGroupAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationChannelGroupAsync');
  }

  return await NotificationChannelGroupManager.deleteNotificationChannelGroupAsync(groupId);
}
