import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Text } from 'react-native';

import Colors, { ColorTheme } from '../constants/Colors';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeColor(props: Props, colorName: ThemedColors) {
  const theme = useTheme();
  const themeName = theme.dark ? ColorTheme.DARK : ColorTheme.LIGHT;
  const colorFromProps = themeName === ColorTheme.DARK ? props.darkColor : props.lightColor;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export const StyledText = (props: Props) => {
  const { style, ...otherProps } = props;
  const color = useThemeColor(props, 'text');

  return <Text style={[{ color }, style]} {...otherProps} />;
};
