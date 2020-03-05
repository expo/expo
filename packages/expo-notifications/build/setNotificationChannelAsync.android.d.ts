import { NotificationChannelInput, NotificationChannel } from './NotificationChannelManager';
export default function setNotificationChannelAsync(channelId: string, channel: NotificationChannelInput): Promise<NotificationChannel | null>;
