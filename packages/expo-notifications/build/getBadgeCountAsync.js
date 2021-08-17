import { UnavailabilityError } from 'expo-modules-core';
import BadgeModule from './BadgeModule';
export default async function getBadgeCountAsync() {
    if (!BadgeModule.getBadgeCountAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getBadgeCountAsync');
    }
    return await BadgeModule.getBadgeCountAsync();
}
//# sourceMappingURL=getBadgeCountAsync.js.map