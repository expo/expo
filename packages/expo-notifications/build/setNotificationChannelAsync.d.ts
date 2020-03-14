import { NotificationChannel, NotificationChannelInput } from './NotificationChannelManager';
export default function setNotificationChannelAsync(channelId: string, channel: NotificationChannelInput): Promise<NotificationChannel | null>;
