import { NotificationChannelGroup, NotificationChannelGroupInput } from './NotificationChannelGroupManager.types';
export default function setNotificationChannelGroupAsync(groupId: string, group: NotificationChannelGroupInput): Promise<NotificationChannelGroup | null>;
