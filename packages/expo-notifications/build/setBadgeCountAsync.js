import { UnavailabilityError, Platform } from 'expo-modules-core';
import BadgeModule from './BadgeModule';
/**
 * Sets the badge of the app's icon to the specified number. Setting it to `0` clears the badge. On iOS, this method requires that you have requested
 * the user's permission for `allowBadge` via [`requestPermissionsAsync`](#requestpermissionsasyncpermissions),
 * otherwise it will automatically return `false`.
 * > **Note:** Not all Android launchers support application badges. If the launcher does not support icon badges, the method will resolve to `false`.
 * @param badgeCount The count which should appear on the badge. A value of `0` will clear the badge.
 * @param options An object of options configuring behavior applied.
 * @return It returns a Promise resolving to a boolean representing whether the setting of the badge succeeded.
 * @header badge
 */
export default async function setBadgeCountAsync(badgeCount, options) {
    if (!BadgeModule.setBadgeCountAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'setBadgeCountAsync');
    }
    return await BadgeModule.setBadgeCountAsync(badgeCount, options?.[Platform.OS]);
}
//# sourceMappingURL=setBadgeCountAsync.js.map