import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';

export default async function getNotificationChannelGroupAsync(
  groupId: string
): Promise<NotificationChannelGroup | null> {
  console.debug('Notification channels feature is only supported on Android.');
  return null;
}
