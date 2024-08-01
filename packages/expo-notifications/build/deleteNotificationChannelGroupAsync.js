/**
 * Removes the notification channel group and all notification channels that belong to it.
 * @param groupId The channel group identifier.
 * @return A Promise which resolves once the channel group is removed (or if there was no channel group for given identifier).
 * @platform android
 * @header channels
 */
export default async function deleteNotificationChannelGroupAsync(groupId) {
    console.debug('Notification channels feature is only supported on Android.');
}
//# sourceMappingURL=deleteNotificationChannelGroupAsync.js.map