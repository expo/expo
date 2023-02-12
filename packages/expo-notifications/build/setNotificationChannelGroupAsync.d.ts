import { NotificationChannelGroup, NotificationChannelGroupInput } from './NotificationChannelGroupManager.types';
/**
 * Assigns the channel group configuration to a channel group of a specified name (creating it if need be).
 * @param groupId The channel group's identifier.
 * @param group Object representing the channel group configuration.
 * @return A `Promise` resolving to the object (of type [`NotificationChannelGroup`](#notificationchannelgroup))
 * describing the modified channel group or to `null` if the platform does not support notification channels.
 * @platform android
 * @header channels
 */
export default function setNotificationChannelGroupAsync(groupId: string, group: NotificationChannelGroupInput): Promise<NotificationChannelGroup | null>;
//# sourceMappingURL=setNotificationChannelGroupAsync.d.ts.map