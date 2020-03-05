import { NotificationChannelGroupInput } from './NotificationChannelGroupManager';
import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';
export default function setNotificationChannelGroupAsync(groupId: string, group: NotificationChannelGroupInput): Promise<NotificationChannelGroup | null>;
