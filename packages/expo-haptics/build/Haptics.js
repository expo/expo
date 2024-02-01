import { UnavailabilityError } from 'expo-modules-core';
import ExpoHaptics from './ExpoHaptics';
import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';
// @needsAudit
/**
 * The kind of notification response used in the feedback.
 * @param type A notification feedback type that on iOS is directly mapped to [UINotificationFeedbackType](https://developer.apple.com/documentation/uikit/uinotificationfeedbacktype),
 * while on Android these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator).
 * You can use one of `Haptics.NotificationFeedbackType.{Success, Warning, Error}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function notificationAsync(type = NotificationFeedbackType.Success) {
    if (!ExpoHaptics.notificationAsync) {
        throw new UnavailabilityError('Haptics', 'notificationAsync');
    }
    await ExpoHaptics.notificationAsync(type);
}
// @needsAudit
/**
 * @param style A collision indicator that on iOS is directly mapped to [`UIImpactFeedbackStyle`](https://developer.apple.com/documentation/uikit/uiimpactfeedbackstyle),
 * while on Android these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator).
 * You can use one of `Haptics.ImpactFeedbackStyle.{Light, Medium, Heavy}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function impactAsync(style = ImpactFeedbackStyle.Medium) {
    if (!ExpoHaptics.impactAsync) {
        throw new UnavailabilityError('Haptic', 'impactAsync');
    }
    await ExpoHaptics.impactAsync(style);
}
// @needsAudit
/**
 * Used to let a user know when a selection change has been registered.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function selectionAsync() {
    if (!ExpoHaptics.selectionAsync) {
        throw new UnavailabilityError('Haptic', 'selectionAsync');
    }
    await ExpoHaptics.selectionAsync();
}
export { NotificationFeedbackType, ImpactFeedbackStyle };
//# sourceMappingURL=Haptics.js.map