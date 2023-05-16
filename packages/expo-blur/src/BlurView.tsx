import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import getReanimatedIfAvailable from './getReanimatedIfAvailable';
import isSharedValue from './isSharedValue';

const NativeBlurView = requireNativeViewManager('ExpoBlurView');

// Animated version of the NativeBlurView has to be created here  because
// is not directly available to the user. Therefore, using
// Animated.createAnimatedComponent(BlurView) will not have the desired effects.
// We pass the animated props directly to the animated component if available
const Reanimated = getReanimatedIfAvailable();
const AnimatedNativeBlurView = Reanimated?.default.createAnimatedComponent(NativeBlurView);

function FnBlurView({
  tint = 'default',
  intensity = 50,
  blurReductionFactor = 4,
  style,
  children,
  ...props
}: BlurViewProps) {
  const intensityIsSharedValue = isSharedValue(intensity);

  if (intensityIsSharedValue && Reanimated === undefined) {
    console.warn(
      "You are trying to animate the blur intensity using a SharedValue, but 'react-native-reanimated' is not available. " +
        "Make sure that 'react-native-reanimated' is correctly installed."
    );
  }

  const BlurComponent =
    intensityIsSharedValue && AnimatedNativeBlurView ? AnimatedNativeBlurView : NativeBlurView;

  const animatedProps =
    intensityIsSharedValue &&
    Reanimated !== undefined &&
    // Number of hooks will not change during runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Reanimated?.useAnimatedProps(() => ({
      intensity: Math.min(intensity.value, 100),
    }));

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

// Functional component is required to use useAnimatedProps and class-based component is required by React Animated
// Wrapping function component with class-based component fixes the conflict
export default class BlurView extends React.Component<BlurViewProps> {
  render() {
    return <FnBlurView {...this.props} />;
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});
