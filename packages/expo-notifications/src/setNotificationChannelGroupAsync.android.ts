import { UnavailabilityError } from '@unimodules/core';

import NotificationChannelGroupManager, {
  NotificationChannelGroup,
  NotificationChannelGroupInput,
} from './NotificationChannelGroupManager';

export default async function setNotificationChannelGroupAsync(
  groupId: string,
  group: NotificationChannelGroupInput
): Promise<NotificationChannelGroup | null> {
  if (!NotificationChannelGroupManager.setNotificationChannelGroupAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationChannelGroupAsync');
  }

  return await NotificationChannelGroupManager.setNotificationChannelGroupAsync(groupId, group);
}
