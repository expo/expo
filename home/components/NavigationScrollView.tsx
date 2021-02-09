import { useTheme, useScrollToTop } from '@react-navigation/native';
import React, { useRef } from 'react';
import { ScrollView } from 'react-native-gesture-handler';

import Colors from '../constants/Colors';

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

type ScrollViewProps = ScrollView['props'];
interface StyledScrollViewProps extends ScrollViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
}

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

export default (props: ScrollViewProps) => {
  const ref = useRef(null);
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeBackgroundColor(props, 'bodyBackground');

  useScrollToTop(ref);

  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} ref={ref} />;
};
