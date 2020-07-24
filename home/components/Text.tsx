import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import Colors from '../constants/Colors';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeColor(props: Props, colorName: ThemedColors) {
  const theme = useTheme();
  const themeName = theme.dark ? 'dark' : 'light';
  const colorFromProps = props[`${themeName}Color`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export const SectionLabelText = (props: Props) => {
  const { style, ...otherProps } = props;
  const color = useThemeColor(props, 'sectionLabelText');

  return <Text style={[styles.sectionLabelText, { color }, style]} {...otherProps} />;
};

export const GenericCardTitle = (props: Props) => {
  const { style, ...otherProps } = props;
  const color = useThemeColor(props, 'cardTitle');

  return <Text style={[styles.genericCardTitle, { color }, style]} {...otherProps} />;
};

export const StyledText = (props: Props) => {
  const { style, ...otherProps } = props;
  const color = useThemeColor(props, 'text');

  return <Text style={[{ color }, style]} {...otherProps} />;
};

const styles = StyleSheet.create({
  sectionLabelText: {
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
        fontSize: 11,
      },
      android: {
        fontWeight: '400',
        fontSize: 12,
      },
    }),
  },
  genericCardTitle: {
    color: Colors.light.blackText,
    fontSize: 16,
    marginRight: 50,
    marginBottom: 2,
    fontWeight: '400',
  },
});
