/**
 * Removes the notification channel.
 * @param channelId The channel identifier.
 * @return A Promise which resolving once the channel is removed (or if there was no channel for given identifier).
 * @platform android
 * @header channels
 */
export default async function deleteNotificationChannelAsync(channelId: string): Promise<void> {
  console.debug('Notification channels feature is only supported on Android.');
}
