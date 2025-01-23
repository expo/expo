import { Platform, UnavailabilityError } from 'expo-modules-core';

import ExpoHaptics from './ExpoHaptics';
import { NotificationFeedbackType, ImpactFeedbackStyle, AndroidHaptics } from './Haptics.types';

// @needsAudit
/**
 * The kind of notification response used in the feedback.
 * @param type A notification feedback type that on Android is simulated using [`Vibrator`](https://developer.android.com/reference/android/os/Vibrator)
 * and iOS is directly mapped to [`UINotificationFeedbackType`](https://developer.apple.com/documentation/uikit/uinotificationfeedbacktype).
 * You can use one of `Haptics.NotificationFeedbackType.{Success, Warning, Error}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function notificationAsync(
  type: NotificationFeedbackType = NotificationFeedbackType.Success
): Promise<void> {
  if (!ExpoHaptics?.notificationAsync) {
    throw new UnavailabilityError('Haptics', 'notificationAsync');
  }
  await ExpoHaptics.notificationAsync(type);
}

// @needsAudit
/**
 * @param style A collision indicator that on Android is simulated using [`Vibrator`](https://developer.android.com/reference/android/os/Vibrator)
 * and on iOS, it is directly mapped to [`UIImpactFeedbackStyle`](https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator/feedbackstyle).
 * You can use one of `Haptics.ImpactFeedbackStyle.{Light, Medium, Heavy, Rigid, Soft}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function impactAsync(
  style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium
): Promise<void> {
  if (!ExpoHaptics?.impactAsync) {
    throw new UnavailabilityError('Haptic', 'impactAsync');
  }
  await ExpoHaptics.impactAsync(style);
}

// @needsAudit
/**
 * Used to let a user know when a selection change has been registered.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export async function selectionAsync(): Promise<void> {
  if (!ExpoHaptics?.selectionAsync) {
    throw new UnavailabilityError('Haptic', 'selectionAsync');
  }
  await ExpoHaptics.selectionAsync();
}

/**
 * Use the device haptics engine to provide physical feedback to the user.
 *
 * @platform android
 */
export async function performAndroidHapticsAsync(type: AndroidHaptics) {
  if (Platform.OS !== 'android') {
    return;
  }
  ExpoHaptics.performHapticsAsync(type);
}

export { NotificationFeedbackType, ImpactFeedbackStyle, AndroidHaptics };
