import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelGroupManager from './NotificationChannelGroupManager';
import {
  NotificationChannelGroup,
  NotificationChannelGroupInput,
} from './NotificationChannelGroupManager.types';

export default async function setNotificationChannelGroupAsync(
  groupId: string,
  group: NotificationChannelGroupInput
): Promise<NotificationChannelGroup | null> {
  if (!NotificationChannelGroupManager.setNotificationChannelGroupAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationChannelGroupAsync');
  }

  return await NotificationChannelGroupManager.setNotificationChannelGroupAsync(groupId, group);
}
