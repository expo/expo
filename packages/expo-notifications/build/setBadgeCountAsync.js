import { UnavailabilityError, Platform } from 'expo-modules-core';
import BadgeModule from './BadgeModule';
export default async function setBadgeCountAsync(badgeCount, options) {
    if (!BadgeModule.setBadgeCountAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'setBadgeCountAsync');
    }
    return await BadgeModule.setBadgeCountAsync(badgeCount, options?.[Platform.OS]);
}
//# sourceMappingURL=setBadgeCountAsync.js.map