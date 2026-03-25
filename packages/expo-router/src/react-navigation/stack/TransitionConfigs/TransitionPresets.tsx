import { Platform } from 'react-native';

import type { TransitionPreset } from '../types';
import {
  forBottomSheetAndroid,
  forFadeFromBottomAndroid,
  forFadeFromCenter as forFadeCard,
  forFadeFromRightAndroid,
  forHorizontalIOS,
  forHorizontalIOSInverted,
  forModalPresentationIOS,
  forRevealFromBottomAndroid,
  forScaleFromCenterAndroid,
  forVerticalIOS,
} from './CardStyleInterpolators';
import { forFade } from './HeaderStyleInterpolators';
import {
  BottomSheetSlideInSpec,
  BottomSheetSlideOutSpec,
  FadeInFromBottomAndroidSpec,
  FadeOutToBottomAndroidSpec,
  RevealFromBottomAndroidSpec,
  ScaleFromCenterAndroidSpec,
  TransitionIOSSpec,
} from './TransitionSpecs';

const ANDROID_VERSION_PIE = 28;
const ANDROID_VERSION_10 = 29;
const ANDROID_VERSION_14 = 34;

/**
 * Standard iOS navigation transition.
 */
export const SlideFromRightIOS: TransitionPreset = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: TransitionIOSSpec,
    close: TransitionIOSSpec,
  },
  cardStyleInterpolator: forHorizontalIOS,
  headerStyleInterpolator: forFade,
};

/**
 * Standard iOS navigation transition for modals.
 */
export const ModalSlideFromBottomIOS: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: TransitionIOSSpec,
    close: TransitionIOSSpec,
  },
  cardStyleInterpolator: forVerticalIOS,
  headerStyleInterpolator: forFade,
};

/**
 * Standard iOS modal presentation style (introduced in iOS 13).
 */
export const ModalPresentationIOS: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: TransitionIOSSpec,
    close: TransitionIOSSpec,
  },
  cardStyleInterpolator: forModalPresentationIOS,
  headerStyleInterpolator: forFade,
};

/**
 * Standard Android navigation transition when opening or closing an Activity on Android < 9 (Oreo).
 */
export const FadeFromBottomAndroid: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: FadeInFromBottomAndroidSpec,
    close: FadeOutToBottomAndroidSpec,
  },
  cardStyleInterpolator: forFadeFromBottomAndroid,
  headerStyleInterpolator: forFade,
};

/**
 * Standard Android navigation transition when opening or closing an Activity on Android 9 (Pie).
 */
export const RevealFromBottomAndroid: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: RevealFromBottomAndroidSpec,
    close: RevealFromBottomAndroidSpec,
  },
  cardStyleInterpolator: forRevealFromBottomAndroid,
  headerStyleInterpolator: forFade,
};

/**
 * Standard Android navigation transition when opening or closing an Activity on Android 10 (Q).
 */
export const ScaleFromCenterAndroid: TransitionPreset = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: ScaleFromCenterAndroidSpec,
    close: ScaleFromCenterAndroidSpec,
  },
  cardStyleInterpolator: forScaleFromCenterAndroid,
  headerStyleInterpolator: forFade,
};

/**
 * Standard Android navigation transition when opening or closing an Activity on Android 14.
 */
export const FadeFromRightAndroid: TransitionPreset = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: FadeInFromBottomAndroidSpec,
    close: FadeOutToBottomAndroidSpec,
  },
  cardStyleInterpolator: forFadeFromRightAndroid,
  headerStyleInterpolator: forFade,
};

/**
 * Standard bottom sheet slide transition for Android 10.
 */
export const BottomSheetAndroid: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: BottomSheetSlideInSpec,
    close: BottomSheetSlideOutSpec,
  },
  cardStyleInterpolator: forBottomSheetAndroid,
  headerStyleInterpolator: forFade,
};

/**
 * Fade transition for transparent modals.
 */
export const ModalFadeTransition: TransitionPreset = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: BottomSheetSlideInSpec,
    close: BottomSheetSlideOutSpec,
  },
  cardStyleInterpolator: forFadeCard,
  headerStyleInterpolator: forFade,
};

/**
 * Default navigation transition for the current platform.
 */
export const DefaultTransition = Platform.select({
  ios: SlideFromRightIOS,
  android:
    Number(Platform.Version) >= ANDROID_VERSION_14
      ? FadeFromRightAndroid
      : Number(Platform.Version) >= ANDROID_VERSION_10
        ? ScaleFromCenterAndroid
        : Number(Platform.Version) >= ANDROID_VERSION_PIE
          ? RevealFromBottomAndroid
          : FadeFromBottomAndroid,
  default: ScaleFromCenterAndroid,
});

/**
 * Default modal transition for the current platform.
 */
export const ModalTransition = Platform.select({
  ios: ModalPresentationIOS,
  default: BottomSheetAndroid,
});

/**
 * Slide from left transition.
 */
export const SlideFromLeftIOS: TransitionPreset = {
  ...SlideFromRightIOS,
  cardStyleInterpolator: forHorizontalIOSInverted,
};
