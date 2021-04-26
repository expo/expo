import { UnavailabilityError } from '@unimodules/core';
import ExpoHaptics from './ExpoHaptics';
import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';
/**
 * Triggers notification feedback.
 */
export async function notificationAsync(type = NotificationFeedbackType.Success) {
    if (!ExpoHaptics.notificationAsync) {
        throw new UnavailabilityError('Haptics', 'notificationAsync');
    }
    await ExpoHaptics.notificationAsync(type);
}
/**
 * Triggers impact feedback.
 */
export async function impactAsync(style = ImpactFeedbackStyle.Medium) {
    if (!ExpoHaptics.impactAsync) {
        throw new UnavailabilityError('Haptic', 'impactAsync');
    }
    await ExpoHaptics.impactAsync(style);
}
/**
 * Triggers selection feedback.
 */
export async function selectionAsync() {
    if (!ExpoHaptics.selectionAsync) {
        throw new UnavailabilityError('Haptic', 'selectionAsync');
    }
    await ExpoHaptics.selectionAsync();
}
export { NotificationFeedbackType, ImpactFeedbackStyle };
//# sourceMappingURL=Haptics.js.map