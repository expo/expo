import type { StackCardInterpolatedStyle, StackCardInterpolationProps } from '../types';
/**
 * Standard iOS-style slide in from the right.
 */
export declare function forHorizontalIOS({ current, next, inverted, layouts: { screen }, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * iOS-style slide in from the left.
 */
export declare function forHorizontalIOSInverted({ inverted, ...rest }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard iOS-style slide in from the bottom (used for modals).
 */
export declare function forVerticalIOS({ current, inverted, layouts: { screen }, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard iOS-style modal animation in iOS 13.
 */
export declare function forModalPresentationIOS({ index, current, next, inverted, layouts: { screen }, insets, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard Android-style fade in from the bottom for Android Oreo.
 */
export declare function forFadeFromBottomAndroid({ current, inverted, layouts: { screen }, closing, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard Android-style reveal from the bottom for Android Pie.
 */
export declare function forRevealFromBottomAndroid({ current, next, inverted, layouts: { screen }, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard Android-style zoom for Android 10.
 */
export declare function forScaleFromCenterAndroid({ current, next, closing, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard Android-style fade from right for Android 14.
 */
export declare function forFadeFromRightAndroid({ current, next, inverted, closing, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Standard bottom sheet slide in from the bottom for Android.
 */
export declare function forBottomSheetAndroid({ current, inverted, layouts: { screen }, closing, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
/**
 * Simple fade animation for dialogs
 */
export declare function forFadeFromCenter({ current: { progress }, }: StackCardInterpolationProps): StackCardInterpolatedStyle;
export declare function forNoAnimation(): StackCardInterpolatedStyle;
//# sourceMappingURL=CardStyleInterpolators.d.ts.map