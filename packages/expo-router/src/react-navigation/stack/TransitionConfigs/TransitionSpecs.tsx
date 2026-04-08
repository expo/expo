import { Easing } from 'react-native';

import type { TransitionSpec } from '../types';

/**
 * Exact values from UINavigationController's animation configuration.
 */
export const TransitionIOSSpec: TransitionSpec = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 10,
    restSpeedThreshold: 10,
  },
};

/**
 * Configuration for activity open animation from Android Nougat.
 * See http://aosp.opersys.com/xref/android-7.1.2_r37/xref/frameworks/base/core/res/res/anim/activity_open_enter.xml
 */
export const FadeInFromBottomAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 350,
    easing: Easing.out(Easing.poly(5)),
  },
};

/**
 * Configuration for activity close animation from Android Nougat.
 * See http://aosp.opersys.com/xref/android-7.1.2_r37/xref/frameworks/base/core/res/res/anim/activity_close_exit.xml
 */
export const FadeOutToBottomAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    easing: Easing.in(Easing.linear),
  },
};

/**
 * Approximate configuration for activity open animation from Android Pie.
 * See http://aosp.opersys.com/xref/android-9.0.0_r47/xref/frameworks/base/core/res/res/anim/activity_open_enter.xml
 */
export const RevealFromBottomAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 425,
    // This is super rough approximation of the path used for the curve by android
    // See http://aosp.opersys.com/xref/android-9.0.0_r47/xref/frameworks/base/core/res/res/interpolator/fast_out_extra_slow_in.xml
    easing: Easing.bezier(0.20833, 0.82, 0.25, 1),
  },
};

/**
 * Approximate configuration for activity open animation from Android Q.
 * See http://aosp.opersys.com/xref/android-10.0.0_r2/xref/frameworks/base/core/res/res/anim/activity_open_enter.xml
 */
export const ScaleFromCenterAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 400,
    // This is super rough approximation of the path used for the curve by android
    // See http://aosp.opersys.com/xref/android-10.0.0_r2/xref/frameworks/base/core/res/res/interpolator/fast_out_extra_slow_in.xml
    easing: Easing.bezier(0.20833, 0.82, 0.25, 1),
  },
};

/**
 * Approximate configuration for activity open animation from Android 14.
 * See https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r51/core/res/res/anim/activity_open_enter.xml
 */
export const FadeInFromRightAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 450,
    // This is super rough approximation of the path used for the curve by android
    // See https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r51/core/res/res/interpolator/fast_out_extra_slow_in.xml
    easing: Easing.bezier(0.20833, 0.82, 0.25, 1),
  },
};

/**
 * Approximate configuration for activity close animation from Android 14.
 * See https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r51/core/res/res/anim/activity_close_exit.xml
 */
export const FadeOutToLeftAndroidSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 450,
    // This is super rough approximation of the path used for the curve by android
    // See https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r51/core/res/res/interpolator/fast_out_extra_slow_in.xml
    easing: Easing.bezier(0.20833, 0.82, 0.25, 1),
  },
};

/**
 * Configuration for bottom sheet slide in animation from Material Design.
 * See https://github.com/material-components/material-components-android/blob/fd3639092e1ffef9dc11bcedf79f32801d85e898/lib/java/com/google/android/material/bottomsheet/res/anim/mtrl_bottom_sheet_slide_in.xml
 */
export const BottomSheetSlideInSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 250,
    // See https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/view/animation/AccelerateDecelerateInterpolator.java
    easing: (t) => Math.cos((t + 1) * Math.PI) / 2.0 + 0.5,
  },
};

/**
 * Configuration for bottom sheet slide out animation from Material Design.
 * See https://github.com/material-components/material-components-android/blob/fd3639092e1ffef9dc11bcedf79f32801d85e898/lib/java/com/google/android/material/bottomsheet/res/anim/mtrl_bottom_sheet_slide_in.xml
 */
export const BottomSheetSlideOutSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 200,
    // See https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/view/animation/AccelerateInterpolator.java
    easing: (t) => (t === 1.0 ? 1 : Math.pow(t, 2)),
  },
};
