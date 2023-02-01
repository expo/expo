import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';
/**
 * Fetches information about a single notification channel group.
 * @param groupId The channel group's identifier.
 * @return A Promise which resolves to the channel group object (of type [`NotificationChannelGroup`](#notificationchannelgroup))
 * or to `null` if there was no channel group found for this identifier. On platforms that do not support notification channels,
 * it will always resolve to `null`.
 * @platform android
 * @header channels
 */
export default function getNotificationChannelGroupAsync(groupId: string): Promise<NotificationChannelGroup | null>;
//# sourceMappingURL=getNotificationChannelGroupAsync.d.ts.map