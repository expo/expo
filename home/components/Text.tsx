import * as React from 'react';
import { useTheme } from 'react-navigation';
import { Platform, StyleSheet, Text } from 'react-native';

import Colors from '../constants/Colors';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeColor(props: Props, colorName: ThemedColors) {
  let theme = useTheme();
  let colorFromProps = props[`${theme}Color`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export const SectionLabelText = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'sectionLabelText');

  return <Text style={[styles.sectionLabelText, { color }, style]} {...otherProps} />;
};

export const GenericCardTitle = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'cardTitle');

  return <Text style={[styles.genericCardTitle, { color }, style]} {...otherProps} />;
};

export const StyledText = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'text');

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
