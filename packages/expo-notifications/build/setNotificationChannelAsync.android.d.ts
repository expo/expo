import { NotificationChannelInput, NotificationChannel } from './NotificationChannelManager.types';
export default function setNotificationChannelAsync(channelId: string, channel: NotificationChannelInput): Promise<NotificationChannel | null>;
