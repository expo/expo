import { NotificationChannel, NotificationChannelInput } from './NotificationChannelManager.types';

/**
 * Assigns the channel configuration to a channel of a specified name (creating it if need be).
 * This method lets you assign given notification channel to a notification channel group.
 *
 * > **Note:** After a channel has been created, you can modify only its name and description. This limitation is imposed by the Android OS.
 *
 * > **Note:** For some settings to be applied on all Android versions, it may be necessary to duplicate the configuration across both
 * > a single notification and its respective notification channel.
 *
 * For example, for a notification to play a custom sound on Android versions **below** 8.0,
 * the custom notification sound has to be set on the notification (through the [`NotificationContentInput`](#notificationcontentinput)),
 * and for the custom sound to play on Android versions **above** 8.0, the relevant notification channel must have the custom sound configured
 * (through the [`NotificationChannelInput`](#notificationchannelinput)). For more information,
 * see [Set custom notification sounds on Android](#set-custom-notification-sounds).
 * @param channelId The channel identifier.
 * @param channel Object representing the channel's configuration.
 * @return A Promise which resolving to the object (of type [`NotificationChannel`](#notificationchannel)) describing the modified channel
 * or to `null` if the platform does not support notification channels.
 * @platform android
 * @header channels
 */
export default async function setNotificationChannelAsync(
  channelId: string,
  channel: NotificationChannelInput
): Promise<NotificationChannel | null> {
  console.debug('Notification channels feature is only supported on Android.');
  return null;
}
