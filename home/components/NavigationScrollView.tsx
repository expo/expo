import * as React from 'react';
import { useTheme, ScrollView } from 'react-navigation';

import Colors from '../constants/Colors';

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

type ScrollViewProps = ScrollView['props'];
interface StyledScrollViewProps extends ScrollViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
}

function useThemeBackgroundColor(props: StyledScrollViewProps, colorName: ThemedColors) {
  const theme = useTheme();
  const colorFromProps = props[`${theme}BackgroundColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export default (props: ScrollViewProps) => {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeBackgroundColor(props, 'bodyBackground');

  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
};
