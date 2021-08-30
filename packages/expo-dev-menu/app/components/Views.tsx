import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { View, ScrollView } from 'react-native';

import Colors from '../constants/Colors';

type ViewProps = View['props'];
interface Props extends ViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
}

type ScrollViewProps = ScrollView['props'];
interface StyledScrollViewProps extends ScrollViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

export function useThemeName(): string {
  const theme = useTheme();
  return theme.dark ? 'dark' : 'light';
}

function useThemeBackgroundColor(props: Props | StyledScrollViewProps, colorName: ThemedColors) {
  const themeName = useThemeName();
  const colorFromProps = props[`${themeName}BackgroundColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

function useThemeBorderColor(props: Props, colorName: ThemedColors) {
  const themeName = useThemeName();
  const colorFromProps = props[`${themeName}BorderColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export const StyledView = (props: Props) => {
  const {
    style,
    lightBackgroundColor: _lightBackgroundColor,
    darkBackgroundColor: _darkBackgroundColor,
    lightBorderColor: _lightBorderColor,
    darkBorderColor: _darkBorderColor,
    ...otherProps
  } = props;

  const backgroundColor = useThemeBackgroundColor(props, 'background');
  const borderColor = useThemeBorderColor(props, 'border');

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      {...otherProps}
    />
  );
};

type IconProps = {
  component: React.ReactType;
  name: string;
  size: number;
  color: string;
};

export const StyledIcon = (props: IconProps) => {
  const themeName = useThemeName();
  const { component: Component, color, ...rest } = props;

  return <Component {...rest} color={Colors[themeName]?.[color]} />;
};
