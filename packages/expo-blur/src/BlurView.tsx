import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { View, StyleSheet } from 'react-native';

import { BlurProps } from './BlurView.types';

export default class BlurView extends React.Component<BlurProps> {
  render() {
    const { tint = 'default', intensity = 50, style, children, ...props } = this.props;

    return (
      <View {...props} style={[styles.container, style]}>
        <NativeBlurView tint={tint} intensity={intensity} style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});

const NativeBlurView = requireNativeViewManager('ExpoBlurView');
