import { useTheme, useScrollToTop } from '@react-navigation/native';
import React, { PropsWithChildren, useRef } from 'react';
import { ScrollViewProps } from 'react-native';
import { NativeViewGestureHandlerProps, ScrollView } from 'react-native-gesture-handler';

import Colors from '../constants/Colors';

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
  const themeName = theme.dark ? 'dark' : 'light';
  const colorFromProps = props[`${themeName}BackgroundColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export default (props: StyledScrollViewProps) => {
  const ref = useRef(null);
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeBackgroundColor(props, 'bodyBackground');

  useScrollToTop(ref);

  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} ref={ref} />;
};
