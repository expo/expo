import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';
/**
 * The kind of notification response used in the feedback.
 * @param type A notification feedback type that on iOS is directly mapped to [UINotificationFeedbackType](https://developer.apple.com/documentation/uikit/uinotificationfeedbacktype),
 * while on Android these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator).
 * You can use one of `Haptics.NotificationFeedbackType.{Success, Warning, Error}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
/**
 * @param style A collision indicator that on iOS is directly mapped to [`UIImpactFeedbackStyle`](https://developer.apple.com/documentation/uikit/uiimpactfeedbackstyle),
 * while on Android these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator).
 * You can use one of `Haptics.ImpactFeedbackStyle.{Light, Medium, Heavy}`.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
/**
 * Used to let a user know when a selection change has been registered.
 * @return A `Promise` which fulfils once native size haptics functionality is triggered.
 */
export declare function selectionAsync(): Promise<void>;
export { NotificationFeedbackType, ImpactFeedbackStyle };
//# sourceMappingURL=Haptics.d.ts.map