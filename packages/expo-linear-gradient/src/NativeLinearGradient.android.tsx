import { requireNativeViewManager } from '@unimodules/core';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  colors: number[];
  locations?: number[] | null;
  startPoint?: Point | null;
  endPoint?: Point | null;
} & React.ComponentProps<typeof View>;

type Point = [number, number];

export default class NativeLinearGradient extends React.Component<Props> {
  render() {
    const { colors, locations, startPoint, endPoint, children, style, ...props } = this.props;

    // TODO: revisit whether we need to inherit the container's borderRadius since this issue has
    // been resolved: https://github.com/facebook/react-native/issues/3198
    const flatStyle = StyleSheet.flatten(style) || {};
    const borderRadius = flatStyle.borderRadius || 0;

    // This is the format from:
    // https://developer.android.com/reference/android/graphics/Path.html#addRoundRect(android.graphics.RectF,%20float[],%20android.graphics.Path.Direction)
    const borderRadiiPerCorner = [
      flatStyle.borderTopLeftRadius || borderRadius,
      flatStyle.borderTopLeftRadius || borderRadius,
      flatStyle.borderTopRightRadius || borderRadius,
      flatStyle.borderTopRightRadius || borderRadius,
      flatStyle.borderBottomRightRadius || borderRadius,
      flatStyle.borderBottomRightRadius || borderRadius,
      flatStyle.borderBottomLeftRadius || borderRadius,
      flatStyle.borderBottomLeftRadius || borderRadius,
    ];

    return (
      <View {...props} style={style}>
        <BaseNativeLinearGradient
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          colors={colors}
          startPoint={startPoint}
          endPoint={endPoint}
          locations={locations}
          borderRadii={borderRadiiPerCorner}
        />
        {children}
      </View>
    );
  }
}

const BaseNativeLinearGradient = requireNativeViewManager('ExpoLinearGradient');
