import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { BlurViewProps } from './BlurView.types';

const NativeBlurView = requireNativeViewManager('ExpoBlurView');
export default class BlurView extends React.Component<BlurViewProps> {
  blurViewRef? = React.createRef<typeof NativeBlurView>();

  /**
   * @hidden
   * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
   * function to determine which component should be animated. We want to animate the NativeBlurView.
   */
  getAnimatableRef() {
    return this.blurViewRef?.current;
  }

  render() {
    const {
      tint = 'default',
      intensity = 50,
      blurReductionFactor = 4,
      experimentalBlurMethod = 'none',
      style,
      children,
      ...props
    } = this.props;
    return (
      <View {...props} style={[styles.container, style]}>
        <NativeBlurView
          ref={this.blurViewRef}
          tint={tint}
          intensity={intensity}
          blurReductionFactor={blurReductionFactor}
          experimentalBlurMethod={experimentalBlurMethod}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});
