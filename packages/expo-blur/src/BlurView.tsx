// Copyright © 2024 650 Industries.

'use client';

import React from 'react';
import { View, StyleSheet, findNodeHandle, Platform, type ViewStyle } from 'react-native';

import type { BlurMethod, BlurViewProps } from './BlurView.types';
import { NativeBlurView } from './NativeBlurModule';

type BlurViewState = {
  blurTargetId?: number | null;
};

const nativeBlurViewRadiusStyleKeys = [
  'borderBottomEndRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomStartRadius',
  'borderEndEndRadius',
  'borderEndStartRadius',
  'borderRadius',
  'borderStartEndRadius',
  'borderStartStartRadius',
  'borderTopEndRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopStartRadius',
] as const;

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

    if (this.props.experimentalBlurMethod != null) {
      console.warn(
        'The `experimentalBlurMethod` prop has been depracated. Please use the `blurMethod` prop instead.'
      );
    }
  }

  componentDidUpdate(prevProps: Readonly<BlurViewProps>): void {
    if (prevProps.blurTarget?.current !== this.props.blurTarget?.current) {
      this._updateBlurTargetId();
    }
  }

  _maybeWarnAboutBlurMethod(): void {
    const blurMethod = this._getBlurMethod();
    if (
      Platform.OS === 'android' &&
      (blurMethod === 'dimezisBlurView' || blurMethod === 'dimezisBlurViewSdk31Plus') &&
      !this.props.blurTarget
    ) {
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

  _getBlurMethod(): BlurMethod {
    const providedMethod = this.props.blurMethod ?? this.props.experimentalBlurMethod;
    return providedMethod ?? 'none';
  }

  render() {
    const {
      tint = 'default',
      intensity = 50,
      blurReductionFactor = 4,
      style,
      children,
      ...props
    } = this.props;
    const nativeBlurViewRadiusStyle = getNativeBlurViewRadiusStyle(style);
    const nativeBlurViewStyle = nativeBlurViewRadiusStyle
      ? [StyleSheet.absoluteFill, nativeBlurViewRadiusStyle]
      : StyleSheet.absoluteFill;

    return (
      <View {...props} style={[styles.container, style]}>
        <NativeBlurView
          blurTargetId={this.state.blurTargetId}
          ref={this.blurViewRef}
          tint={tint}
          intensity={intensity}
          blurReductionFactor={blurReductionFactor}
          blurMethod={this._getBlurMethod()}
          style={nativeBlurViewStyle}
        />
        {children}
      </View>
    );
  }
}

function getNativeBlurViewRadiusStyle(style: BlurViewProps['style']): ViewStyle | undefined {
  const flatStyle = StyleSheet.flatten(style);
  if (!flatStyle) {
    return undefined;
  }

  const radiusStyle: ViewStyle = {};
  let hasRadiusStyle = false;

  nativeBlurViewRadiusStyleKeys.forEach((key) => {
    const value = flatStyle[key];
    if (value != null) {
      (radiusStyle as Record<string, unknown>)[key] = value;
      hasRadiusStyle = true;
    }
  });

  if (!hasRadiusStyle) {
    return undefined;
  }

  if (flatStyle.borderCurve != null) {
    radiusStyle.borderCurve = flatStyle.borderCurve;
  }

  radiusStyle.overflow = 'hidden';
  return radiusStyle;
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});
