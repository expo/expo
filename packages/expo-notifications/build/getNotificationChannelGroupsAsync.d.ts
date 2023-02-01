import { NotificationChannelGroup } from './NotificationChannelGroupManager.types';
/**
 * Fetches information about all known notification channel groups.
 * @return A Promise which resoles to an array of channel groups. On platforms that do not support notification channel groups,
 * it will always resolve to an empty array.
 * @platform android
 * @header channels
 */
export default function getNotificationChannelGroupsAsync(): Promise<NotificationChannelGroup[]>;
//# sourceMappingURL=getNotificationChannelGroupsAsync.d.ts.map