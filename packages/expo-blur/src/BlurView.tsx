import { requireNativeViewManager } from 'expo-modules-core';
import React, { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlurViewProps } from './BlurView.types';

// Simplified Reanimated type, copied and slightly modified from react-native-reanimated
let Reanimated:
  | {
      default: {
        createAnimatedComponent<P extends object>(
          component: ComponentType<P>,
          options?: unknown
        ): ComponentType<P>;
      };
    }
  | undefined;

// If available import react-native-reanimated
try {
  Reanimated = require('react-native-reanimated');
  // Make sure that imported reanimated has the required functions
  if (!Reanimated?.default.createAnimatedComponent) {
    Reanimated = undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  // Quietly continue when 'react-native-reanimated' is not available
  Reanimated = undefined;
}

const NativeBlurView = requireNativeViewManager('ExpoBlurView');

// Animated version of the NativeBlurView has to be created here  because
// is not directly available to the user. Therefore, using
// Animated.createAnimatedComponent(BlurView) will not have the desired effects.
// We pass the animated props directly to the animated component if available
const AnimatedNativeBlurView = Reanimated?.default.createAnimatedComponent(NativeBlurView);

class BlurView extends React.Component<BlurViewProps> {
  render() {
    const {
      tint = 'default',
      intensity = 50,
      blurReductionFactor = 4,
      style,
      children,
      animatedProps,
      ...props
    } = this.props;

    if (animatedProps && Reanimated === undefined) {
      console.warn(
        "You've set the animatedProps property, but 'react-native-reanimated' is not available. " +
          "Make sure 'react-native-reanimated' is correctly installed in order to use the animatedProps property."
      );
    }

    const BlurComponent =
      animatedProps && AnimatedNativeBlurView ? AnimatedNativeBlurView : NativeBlurView;

    return (
      <View {...props} style={[styles.container, style]}>
        <BlurComponent
          tint={tint}
          intensity={intensity}
          blurReductionFactor={blurReductionFactor}
          style={StyleSheet.absoluteFill}
          animatedProps={animatedProps}
        />
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});

export default BlurView;
