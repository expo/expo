import * as React from 'react';
import { Text } from 'react-native';

import Colors from '../constants/Colors';
import { useThemeName } from '../hooks/useThemeName';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

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
  const { style, ...otherProps } = props;
  const color = useThemeColor(props, 'text');

  return <Text style={[{ color }, style]} {...otherProps} />;
};

export const MainText = (props: TextProps) => {
  return <StyledText lightColor={Colors.light.text} darkColor={Colors.dark.text} {...props} />;
};

export const SecondaryText = (props: TextProps) => {
  return (
    <StyledText
      lightColor={Colors.light.secondaryText}
      darkColor={Colors.dark.secondaryText}
      {...props}
    />
  );
};
