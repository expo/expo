// Copyright © 2024 650 Industries.

'use client';

import React from 'react';
import { View, StyleSheet, findNodeHandle, Platform } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import { NativeBlurView } from './NativeBlurModule';

type BlurViewState = {
  blurTargetId?: number | null;
};

// TODO: Class components are not supported with React Server Components.
export default class BlurView extends React.Component<BlurViewProps, BlurViewState> {
  constructor(props: BlurViewProps) {
    super(props);
    this.state = {
      blurTargetId: undefined,
    };
  }
  blurViewRef? = React.createRef<typeof NativeBlurView>();

  /**
   * @hidden
   * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
   * function to determine which component should be animated. We want to animate the NativeBlurView.
   */
  getAnimatableRef() {
    return this.blurViewRef?.current;
  }

  componentDidMount(): void {
    this._updateBlurTargetId();
    this._maybeWarnAboutBlurMethod();
  }

  componentDidUpdate(prevProps: Readonly<BlurViewProps>): void {
    if (prevProps.blurTarget?.current !== this.props.blurTarget?.current) {
      this._updateBlurTargetId();
    }
  }

  _maybeWarnAboutBlurMethod(): void {
    const blurMethod = this.props.experimentalBlurMethod ?? 'none';
    if (Platform.OS === 'android' && blurMethod === 'dimezisBlurView' && !this.props.blurTarget) {
      // The fallback happens on the native side
      console.warn(
        `You have selected the "${blurMethod}" blur method, but the \`blurTarget\` prop has not been configured. The blur view will fallback to "none" blur method to avoid errors. You can learn more about the new BlurView API at: https://docs.expo.dev/versions/latest/sdk/blur-view/`
      );
    }
  }

  _updateBlurTargetId = () => {
    const blurTarget = this.props.blurTarget?.current;
    const blurTargetId = blurTarget ? findNodeHandle(blurTarget) : undefined;
    this.setState(() => ({
      blurTargetId,
    }));
  };

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
          blurTargetId={this.state.blurTargetId}
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
