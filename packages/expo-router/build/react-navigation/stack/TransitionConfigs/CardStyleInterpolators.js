"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forHorizontalIOS = forHorizontalIOS;
exports.forHorizontalIOSInverted = forHorizontalIOSInverted;
exports.forVerticalIOS = forVerticalIOS;
exports.forModalPresentationIOS = forModalPresentationIOS;
exports.forFadeFromBottomAndroid = forFadeFromBottomAndroid;
exports.forRevealFromBottomAndroid = forRevealFromBottomAndroid;
exports.forScaleFromCenterAndroid = forScaleFromCenterAndroid;
exports.forFadeFromRightAndroid = forFadeFromRightAndroid;
exports.forBottomSheetAndroid = forBottomSheetAndroid;
exports.forFadeFromCenter = forFadeFromCenter;
exports.forNoAnimation = forNoAnimation;
const react_native_1 = require("react-native");
const conditional_1 = require("../utils/conditional");
const { add, multiply } = react_native_1.Animated;
/**
 * Standard iOS-style slide in from the right.
 */
function forHorizontalIOS({ current, next, inverted, layouts: { screen }, }) {
    const translateFocused = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.width, 0],
        extrapolate: 'clamp',
    }), inverted);
    const translateUnfocused = next
        ? multiply(next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, screen.width * -0.3],
            extrapolate: 'clamp',
        }), inverted)
        : 0;
    const overlayOpacity = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.07],
        extrapolate: 'clamp',
    });
    const shadowOpacity = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
        extrapolate: 'clamp',
    });
    return {
        cardStyle: {
            transform: [
                // Translation for the animation of the current card
                { translateX: translateFocused },
                // Translation for the animation of the card on top of this
                { translateX: translateUnfocused },
            ],
        },
        overlayStyle: { opacity: overlayOpacity },
        shadowStyle: { shadowOpacity },
    };
}
/**
 * iOS-style slide in from the left.
 */
function forHorizontalIOSInverted({ inverted, ...rest }) {
    return forHorizontalIOS({
        ...rest,
        inverted: react_native_1.Animated.multiply(inverted, -1),
    });
}
/**
 * Standard iOS-style slide in from the bottom (used for modals).
 */
function forVerticalIOS({ current, inverted, layouts: { screen }, }) {
    const translateY = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height, 0],
        extrapolate: 'clamp',
    }), inverted);
    return {
        cardStyle: {
            transform: [{ translateY }],
        },
    };
}
/**
 * Standard iOS-style modal animation in iOS 13.
 */
function forModalPresentationIOS({ index, current, next, inverted, layouts: { screen }, insets, }) {
    const hasNotchIos = react_native_1.Platform.OS === 'ios' && !react_native_1.Platform.isPad && !react_native_1.Platform.isTV && insets.top > 20;
    const isLandscape = screen.width > screen.height;
    const topOffset = isLandscape ? 0 : 10;
    const statusBarHeight = insets.top;
    const aspectRatio = screen.height / screen.width;
    const progress = add(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    }), next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        })
        : 0);
    const isFirst = index === 0;
    const translateY = multiply(progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [
            screen.height,
            isFirst ? 0 : topOffset,
            (isFirst ? statusBarHeight : 0) - topOffset * aspectRatio,
        ],
    }), inverted);
    const overlayOpacity = progress.interpolate({
        inputRange: [0, 1, 1.0001, 2],
        outputRange: [0, 0.3, 1, 1],
    });
    const scale = isLandscape
        ? 1
        : progress.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [1, 1, screen.width ? 1 - (topOffset * 2) / screen.width : 1],
        });
    const borderRadius = isLandscape
        ? 0
        : isFirst
            ? progress.interpolate({
                inputRange: [0, 1, 1.0001, 2],
                outputRange: [0, 0, hasNotchIos ? 38 : 0, 10],
            })
            : 10;
    return {
        cardStyle: {
            overflow: 'hidden',
            borderCurve: 'continuous',
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            // We don't need these for the animation
            // But different border radius for corners improves animation perf
            borderBottomLeftRadius: hasNotchIos ? borderRadius : 0,
            borderBottomRightRadius: hasNotchIos ? borderRadius : 0,
            marginTop: isFirst ? 0 : statusBarHeight,
            marginBottom: isFirst ? 0 : topOffset,
            transform: [{ translateY }, { scale }],
        },
        overlayStyle: { opacity: overlayOpacity },
    };
}
/**
 * Standard Android-style fade in from the bottom for Android Oreo.
 */
function forFadeFromBottomAndroid({ current, inverted, layouts: { screen }, closing, }) {
    const translateY = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height * 0.08, 0],
        extrapolate: 'clamp',
    }), inverted);
    const opacity = (0, conditional_1.conditional)(closing, current.progress, current.progress.interpolate({
        inputRange: [0, 0.5, 0.9, 1],
        outputRange: [0, 0.25, 0.7, 1],
        extrapolate: 'clamp',
    }));
    return {
        cardStyle: {
            opacity,
            transform: [{ translateY }],
        },
    };
}
/**
 * Standard Android-style reveal from the bottom for Android Pie.
 */
function forRevealFromBottomAndroid({ current, next, inverted, layouts: { screen }, }) {
    const containerTranslateY = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height, 0],
        extrapolate: 'clamp',
    }), inverted);
    const cardTranslateYFocused = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height * (95.9 / 100) * -1, 0],
        extrapolate: 'clamp',
    }), inverted);
    const cardTranslateYUnfocused = next
        ? multiply(next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, screen.height * (2 / 100) * -1],
            extrapolate: 'clamp',
        }), inverted)
        : 0;
    const overlayOpacity = current.progress.interpolate({
        inputRange: [0, 0.36, 1],
        outputRange: [0, 0.1, 0.1],
        extrapolate: 'clamp',
    });
    return {
        containerStyle: {
            overflow: 'hidden',
            transform: [{ translateY: containerTranslateY }],
        },
        cardStyle: {
            transform: [{ translateY: cardTranslateYFocused }, { translateY: cardTranslateYUnfocused }],
        },
        overlayStyle: { opacity: overlayOpacity },
    };
}
/**
 * Standard Android-style zoom for Android 10.
 */
function forScaleFromCenterAndroid({ current, next, closing, }) {
    const progress = add(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    }), next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        })
        : 0);
    const opacity = progress.interpolate({
        inputRange: [0, 0.75, 0.875, 1, 1.0825, 1.2075, 2],
        outputRange: [0, 0, 1, 1, 1, 1, 0],
    });
    const scale = (0, conditional_1.conditional)(closing, current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.925, 1],
        extrapolate: 'clamp',
    }), progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0.85, 1, 1.075],
    }));
    return {
        cardStyle: {
            opacity,
            transform: [{ scale }],
        },
    };
}
/**
 * Standard Android-style fade from right for Android 14.
 */
function forFadeFromRightAndroid({ current, next, inverted, closing, }) {
    const translateFocused = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [96, 0],
        extrapolate: 'clamp',
    }), inverted);
    const translateUnfocused = next
        ? multiply(next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -96],
            extrapolate: 'clamp',
        }), inverted)
        : 0;
    const opacity = (0, conditional_1.conditional)(closing, current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    }), current.progress);
    return {
        cardStyle: {
            opacity,
            transform: [
                // Translation for the animation of the current card
                { translateX: translateFocused },
                // Translation for the animation of the card on top of this
                { translateX: translateUnfocused },
            ],
        },
    };
}
/**
 * Standard bottom sheet slide in from the bottom for Android.
 */
function forBottomSheetAndroid({ current, inverted, layouts: { screen }, closing, }) {
    const translateY = multiply(current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height * 0.8, 0],
        extrapolate: 'clamp',
    }), inverted);
    const opacity = (0, conditional_1.conditional)(closing, current.progress, current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    }));
    const overlayOpacity = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
        extrapolate: 'clamp',
    });
    return {
        cardStyle: {
            opacity,
            transform: [{ translateY }],
        },
        overlayStyle: { opacity: overlayOpacity },
    };
}
/**
 * Simple fade animation for dialogs
 */
function forFadeFromCenter({ current: { progress }, }) {
    return {
        cardStyle: {
            opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
            }),
        },
        overlayStyle: {
            opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
                extrapolate: 'clamp',
            }),
        },
    };
}
function forNoAnimation() {
    return {};
}
//# sourceMappingURL=CardStyleInterpolators.js.map