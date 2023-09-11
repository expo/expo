/**
 * Fetches information about all known notification channel groups.
 * @return A Promise which resoles to an array of channel groups. On platforms that do not support notification channel groups,
 * it will always resolve to an empty array.
 * @platform android
 * @header channels
 */
export default async function getNotificationChannelGroupsAsync() {
    console.debug('Notification channels feature is only supported on Android.');
    return [];
}
//# sourceMappingURL=getNotificationChannelGroupsAsync.js.map