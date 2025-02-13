import { NotificationFeedbackType, ImpactFeedbackStyle, AndroidHaptics } from './Haptics.types';
/**
 * The kind of notification response used in the feedback.
 * @param type A notification feedback type that on Android is simulated using [`Vibrator`](https://developer.android.com/reference/android/os/Vibrator)
 * and iOS is directly mapped to [`UINotificationFeedbackType`](https://developer.apple.com/documentation/uikit/uinotificationfeedbacktype).
 * You can use one of `Haptics.NotificationFeedbackType.{Success, Warning, Error}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
/**
 * @param style A collision indicator that on Android is simulated using [`Vibrator`](https://developer.android.com/reference/android/os/Vibrator)
 * and on iOS, it is directly mapped to [`UIImpactFeedbackStyle`](https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator/feedbackstyle).
 * You can use one of `Haptics.ImpactFeedbackStyle.{Light, Medium, Heavy, Rigid, Soft}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
/**
 * Used to let a user know when a selection change has been registered.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function selectionAsync(): Promise<void>;
/**
 * Use the device haptics engine to provide physical feedback to the user.
 *
 * @platform android
 */
export declare function performAndroidHapticsAsync(type: AndroidHaptics): Promise<void>;
export { NotificationFeedbackType, ImpactFeedbackStyle, AndroidHaptics };
//# sourceMappingURL=Haptics.d.ts.map