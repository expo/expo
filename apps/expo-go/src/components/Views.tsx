import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { ScrollViewProps, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import Colors, { ColorTheme } from '../constants/Colors';

type ViewProps = View['props'];
interface Props extends ViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
}

interface StyledScrollViewProps extends ScrollViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeName(): ColorTheme {
  const theme = useTheme();
  return theme.dark ? ColorTheme.DARK : ColorTheme.LIGHT;
}
function useThemeBackgroundColor(props: Props | StyledScrollViewProps, colorName: ThemedColors) {
  const themeName = useThemeName();
  const colorFromProps =
    themeName === ColorTheme.DARK ? props.darkBackgroundColor : props.lightBackgroundColor;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

function useThemeBorderColor(props: Props, colorName: ThemedColors) {
  const themeName = useThemeName();
  const colorFromProps =
    themeName === ColorTheme.DARK ? props.darkBorderColor : props.lightBorderColor;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[themeName][colorName];
  }
}

export const StyledScrollView = React.forwardRef(
  (props: StyledScrollViewProps, ref?: React.Ref<typeof ScrollView>) => {
    const { style, ...otherProps } = props;
    const backgroundColor = useThemeBackgroundColor(props, 'absolute');

    // @ts-expect-error until react-native-gesture-handler fixes the type
    return <ScrollView {...otherProps} style={[{ backgroundColor }, style]} ref={ref} />;
  }
);

export const StyledView = (props: Props) => {
  const {
    style,
    lightBackgroundColor: _lightBackgroundColor,
    darkBackgroundColor: _darkBackgroundColor,
    lightBorderColor: _lightBorderColor,
    darkBorderColor: _darkBorderColor,
    ...otherProps
  } = props;

  const backgroundColor = useThemeBackgroundColor(props, 'cardBackground');
  const borderColor = useThemeBorderColor(props, 'cardSeparator');

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
