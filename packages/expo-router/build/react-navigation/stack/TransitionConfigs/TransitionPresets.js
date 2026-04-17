"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlideFromLeftIOS = exports.ModalTransition = exports.DefaultTransition = exports.ModalFadeTransition = exports.BottomSheetAndroid = exports.FadeFromRightAndroid = exports.ScaleFromCenterAndroid = exports.RevealFromBottomAndroid = exports.FadeFromBottomAndroid = exports.ModalPresentationIOS = exports.ModalSlideFromBottomIOS = exports.SlideFromRightIOS = void 0;
const react_native_1 = require("react-native");
const CardStyleInterpolators_1 = require("./CardStyleInterpolators");
const HeaderStyleInterpolators_1 = require("./HeaderStyleInterpolators");
const TransitionSpecs_1 = require("./TransitionSpecs");
const ANDROID_VERSION_PIE = 28;
const ANDROID_VERSION_10 = 29;
const ANDROID_VERSION_14 = 34;
/**
 * Standard iOS navigation transition.
 */
exports.SlideFromRightIOS = {
    gestureDirection: 'horizontal',
    transitionSpec: {
        open: TransitionSpecs_1.TransitionIOSSpec,
        close: TransitionSpecs_1.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forHorizontalIOS,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard iOS navigation transition for modals.
 */
exports.ModalSlideFromBottomIOS = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.TransitionIOSSpec,
        close: TransitionSpecs_1.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forVerticalIOS,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard iOS modal presentation style (introduced in iOS 13).
 */
exports.ModalPresentationIOS = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.TransitionIOSSpec,
        close: TransitionSpecs_1.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forModalPresentationIOS,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard Android navigation transition when opening or closing an Activity on Android < 9 (Oreo).
 */
exports.FadeFromBottomAndroid = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.FadeInFromBottomAndroidSpec,
        close: TransitionSpecs_1.FadeOutToBottomAndroidSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forFadeFromBottomAndroid,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard Android navigation transition when opening or closing an Activity on Android 9 (Pie).
 */
exports.RevealFromBottomAndroid = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.RevealFromBottomAndroidSpec,
        close: TransitionSpecs_1.RevealFromBottomAndroidSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forRevealFromBottomAndroid,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard Android navigation transition when opening or closing an Activity on Android 10 (Q).
 */
exports.ScaleFromCenterAndroid = {
    gestureDirection: 'horizontal',
    transitionSpec: {
        open: TransitionSpecs_1.ScaleFromCenterAndroidSpec,
        close: TransitionSpecs_1.ScaleFromCenterAndroidSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forScaleFromCenterAndroid,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard Android navigation transition when opening or closing an Activity on Android 14.
 */
exports.FadeFromRightAndroid = {
    gestureDirection: 'horizontal',
    transitionSpec: {
        open: TransitionSpecs_1.FadeInFromBottomAndroidSpec,
        close: TransitionSpecs_1.FadeOutToBottomAndroidSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forFadeFromRightAndroid,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Standard bottom sheet slide transition for Android 10.
 */
exports.BottomSheetAndroid = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.BottomSheetSlideInSpec,
        close: TransitionSpecs_1.BottomSheetSlideOutSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forBottomSheetAndroid,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Fade transition for transparent modals.
 */
exports.ModalFadeTransition = {
    gestureDirection: 'vertical',
    transitionSpec: {
        open: TransitionSpecs_1.BottomSheetSlideInSpec,
        close: TransitionSpecs_1.BottomSheetSlideOutSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators_1.forFadeFromCenter,
    headerStyleInterpolator: HeaderStyleInterpolators_1.forFade,
};
/**
 * Default navigation transition for the current platform.
 */
exports.DefaultTransition = react_native_1.Platform.select({
    ios: exports.SlideFromRightIOS,
    android: Number(react_native_1.Platform.Version) >= ANDROID_VERSION_14
        ? exports.FadeFromRightAndroid
        : Number(react_native_1.Platform.Version) >= ANDROID_VERSION_10
            ? exports.ScaleFromCenterAndroid
            : Number(react_native_1.Platform.Version) >= ANDROID_VERSION_PIE
                ? exports.RevealFromBottomAndroid
                : exports.FadeFromBottomAndroid,
    default: exports.ScaleFromCenterAndroid,
});
/**
 * Default modal transition for the current platform.
 */
exports.ModalTransition = react_native_1.Platform.select({
    ios: exports.ModalPresentationIOS,
    default: exports.BottomSheetAndroid,
});
/**
 * Slide from left transition.
 */
exports.SlideFromLeftIOS = {
    ...exports.SlideFromRightIOS,
    cardStyleInterpolator: CardStyleInterpolators_1.forHorizontalIOSInverted,
};
//# sourceMappingURL=TransitionPresets.js.map