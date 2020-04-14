import {
  NotificationChannelGroup,
  NotificationChannelGroupInput,
} from './NotificationChannelGroupManager.types';

export default async function setNotificationChannelGroupAsync(
  groupId: string,
  group: NotificationChannelGroupInput
): Promise<NotificationChannelGroup | null> {
  console.debug('Notification channels feature is only supported on Android.');
  return null;
}
