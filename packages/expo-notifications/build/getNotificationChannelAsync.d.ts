import { NotificationChannel } from './NotificationChannelManager.types';
/**
 * Fetches information about a single notification channel.
 * @param channelId The channel's identifier.
 * @return A Promise which resolves to the channel object (of type [`NotificationChannel`](#notificationchannel)) or to `null`
 * if there was no channel found for this identifier. On platforms that do not support notification channels, it will always resolve to `null`.
 * @platform android
 * @header channels
 */
export default function getNotificationChannelAsync(channelId: string): Promise<NotificationChannel | null>;
//# sourceMappingURL=getNotificationChannelAsync.d.ts.map