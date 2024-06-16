import { useTheme, useScrollToTop } from '@react-navigation/native';
import React, { PropsWithChildren, useRef } from 'react';
import { ScrollViewProps, ScrollView as RNScrollView, Platform } from 'react-native';
import {
  NativeViewGestureHandlerProps,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';

import Colors, { ColorTheme } from '../constants/Colors';

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

type StyledScrollViewProps = PropsWithChildren<
  ScrollViewProps &
    NativeViewGestureHandlerProps & {
      lightBackgroundColor?: string;
      darkBackgroundColor?: string;
    }
>;

function useThemeBackgroundColor(props: StyledScrollViewProps, colorName: ThemedColors) {
  const theme = useTheme();
  const themeName = theme.dark ? ColorTheme.DARK : ColorTheme.LIGHT;
  const colorFromProps =
    themeName === ColorTheme.DARK ? props.darkBackgroundColor : props.lightBackgroundColor;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export default function NavigationScrollView(props: StyledScrollViewProps) {
  const ref = useRef(null);
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeBackgroundColor(props, 'bodyBackground');

  useScrollToTop(ref);

  const ScrollView = Platform.OS === 'android' ? RNScrollView : RNGHScrollView;

  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} ref={ref} />;
}
