import * as React from 'react';
import { useTheme } from '@react-navigation/native';
import { Text } from 'react-native';

import Colors from '../constants/Colors';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeName(): string {
  const theme = useTheme();
  return theme.dark ? 'dark' : 'light';
}

function useThemeColor(props: Props, colorName: ThemedColors) {
  const themeName = useThemeName();
  const colorFromProps = props[`${themeName}Color`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export const StyledText = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'text');

  return <Text style={[{ color }, style]} {...otherProps} />;
};
