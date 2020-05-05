import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';

export default async function getNotificationChannelGroupsAsync(): Promise<
  NotificationChannelGroup[]
> {
  console.debug('Notification channels feature is only supported on Android.');
  return [];
}
