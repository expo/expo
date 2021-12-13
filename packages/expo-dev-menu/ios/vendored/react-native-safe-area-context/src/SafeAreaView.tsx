import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from './SafeAreaContext';
import { Edge, NativeSafeAreaViewProps } from './SafeArea.types';

// prettier-ignore
const TOP    = 0b1000,
      RIGHT  = 0b0100,
      BOTTOM = 0b0010,
      LEFT   = 0b0001,
      ALL    = 0b1111;

/* eslint-disable no-bitwise */

const edgeBitmaskMap: Record<Edge, number> = {
  top: TOP,
  right: RIGHT,
  bottom: BOTTOM,
  left: LEFT,
};

export function SafeAreaView({
  style = {},
  mode,
  edges,
  ...rest
}: NativeSafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  const edgeBitmask =
    edges != null
      ? edges.reduce((accum, edge) => accum | edgeBitmaskMap[edge], 0)
      : ALL;

  const appliedStyle = React.useMemo(() => {
    const insetTop = edgeBitmask & TOP ? insets.top : 0;
    const insetRight = edgeBitmask & RIGHT ? insets.right : 0;
    const insetBottom = edgeBitmask & BOTTOM ? insets.bottom : 0;
    const insetLeft = edgeBitmask & LEFT ? insets.left : 0;

    const flatStyle = StyleSheet.flatten(style) as Record<string, number>;

    if (mode === 'margin') {
      const {
        margin = 0,
        marginVertical = margin,
        marginHorizontal = margin,
        marginTop = marginVertical,
        marginRight = marginHorizontal,
        marginBottom = marginVertical,
        marginLeft = marginHorizontal,
      } = flatStyle;

      const marginStyle = {
        marginTop: marginTop + insetTop,
        marginRight: marginRight + insetRight,
        marginBottom: marginBottom + insetBottom,
        marginLeft: marginLeft + insetLeft,
      };

      return [style, marginStyle];
    } else {
      const {
        padding = 0,
        paddingVertical = padding,
        paddingHorizontal = padding,
        paddingTop = paddingVertical,
        paddingRight = paddingHorizontal,
        paddingBottom = paddingVertical,
        paddingLeft = paddingHorizontal,
      } = flatStyle;

      const paddingStyle = {
        paddingTop: paddingTop + insetTop,
        paddingRight: paddingRight + insetRight,
        paddingBottom: paddingBottom + insetBottom,
        paddingLeft: paddingLeft + insetLeft,
      };

      return [style, paddingStyle];
    }
  }, [style, insets, mode, edgeBitmask]);

  return <View style={appliedStyle} {...rest} />;
}
