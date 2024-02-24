import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { NativeLinearGradientProps } from './NativeLinearGradient.types';

export default function NativeLinearGradient({
  colors,
  locations,
  startPoint,
  endPoint,
  children,
  style,
  dither,
  ...props
}: NativeLinearGradientProps): React.ReactElement {
  // TODO: revisit whether we need to inherit the container's borderRadius since this issue has
  // been resolved: https://github.com/facebook/react-native/issues/3198
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const borderRadius = flatStyle.borderRadius ?? 0;

  // This is the format from:
  // https://developer.android.com/reference/android/graphics/Path.html#addRoundRect(android.graphics.RectF,%20float[],%20android.graphics.Path.Direction)
  const borderRadiiPerCorner = [
    flatStyle.borderTopLeftRadius ?? borderRadius,
    flatStyle.borderTopLeftRadius ?? borderRadius,
    flatStyle.borderTopRightRadius ?? borderRadius,
    flatStyle.borderTopRightRadius ?? borderRadius,
    flatStyle.borderBottomRightRadius ?? borderRadius,
    flatStyle.borderBottomRightRadius ?? borderRadius,
    flatStyle.borderBottomLeftRadius ?? borderRadius,
    flatStyle.borderBottomLeftRadius ?? borderRadius,
  ];

  return (
    <View {...props} style={style}>
      <BaseNativeLinearGradient
        style={StyleSheet.absoluteFill}
        colors={colors}
        startPoint={startPoint}
        endPoint={endPoint}
        locations={locations}
        borderRadii={borderRadiiPerCorner}
        dither={dither}
      />
      {children}
    </View>
  );
}

const BaseNativeLinearGradient = requireNativeViewManager('ExpoLinearGradient');
