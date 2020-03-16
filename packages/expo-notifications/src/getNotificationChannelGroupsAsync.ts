import { NotificationChannelGroup } from './NotificationChannelGroupManager';

export default async function getNotificationChannelGroupsAsync(): Promise<
  NotificationChannelGroup[]
> {
  console.debug('Notification channels feature is only supported on Android.');
  return [];
}
