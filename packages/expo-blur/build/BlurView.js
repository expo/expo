import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';
// Simplified Reanimated type, copied and slightly modified from react-native-reanimated
let Reanimated;
// If available import react-native-reanimated
try {
    Reanimated = require('react-native-reanimated');
    // Make sure that imported reanimated has the required functions
    if (!Reanimated?.default.createAnimatedComponent) {
        Reanimated = undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
}
catch (e) {
    // Quietly continue when 'react-native-reanimated' is not available
    Reanimated = undefined;
}
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
// Animated version of the NativeBlurView has to be created here  because
// is not directly available to the user. Therefore, using
// Animated.createAnimatedComponent(BlurView) will not have the desired effects.
// We pass the animated props directly to the animated component if available
const AnimatedNativeBlurView = Reanimated?.default.createAnimatedComponent(NativeBlurView);
class BlurView extends React.Component {
    render() {
        const { tint = 'default', intensity = 50, blurReductionFactor = 4, style, children, animatedProps, ...props } = this.props;
        if (animatedProps && Reanimated === undefined) {
            console.warn("You've set the animatedProps property, but 'react-native-reanimated' is not available. " +
                "Make sure 'react-native-reanimated' is correctly installed in order to use the animatedProps property.");
        }
        const BlurComponent = animatedProps && AnimatedNativeBlurView ? AnimatedNativeBlurView : NativeBlurView;
        return (React.createElement(View, { ...props, style: [styles.container, style] },
            React.createElement(BlurComponent, { tint: tint, intensity: intensity, blurReductionFactor: blurReductionFactor, style: StyleSheet.absoluteFill, animatedProps: animatedProps }),
            children));
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
export default BlurView;
//# sourceMappingURL=BlurView.js.map