import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

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

function useThemeName(): string {
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

export const StyledScrollView = React.forwardRef(
  (props: StyledScrollViewProps, ref?: React.Ref<ScrollView>) => {
    const { style, ...otherProps } = props;
    const backgroundColor = useThemeBackgroundColor(props, 'absolute');

    return <ScrollView {...otherProps} style={[{ backgroundColor }, style]} ref={ref} />;
  }
);

export const Separator = (props: View['props']) => {
  const themeName = useThemeName();

  const { style, ...otherProps } = props;

  return (
    <View
      style={[styles.separator, { backgroundColor: Colors[themeName].separator }, style]}
      {...otherProps}
    />
  );
};

export const SectionLabelContainer = (props: View['props']) => {
  const themeName = useThemeName();
  const { style, ...otherProps } = props;

  return (
    <View
      style={[
        styles.sectionLabelContainer,
        { backgroundColor: Colors[themeName].sectionLabelBackgroundColor },
        style,
      ]}
      {...otherProps}
    />
  );
};

export const GenericCardContainer = (props: View['props']) => {
  const themeName = useThemeName();
  const { style, ...otherProps } = props;

  return (
    <View
      style={[
        styles.genericCardContainer,
        {
          backgroundColor: Colors[themeName].cardBackground,
          borderBottomColor: Colors[themeName].cardSeparator,
        },
        style,
      ]}
      {...otherProps}
    />
  );
};

export const GenericCardBody = (props: View['props']) => {
  const { style, ...otherProps } = props;

  return <View style={[styles.genericCardBody, style]} {...otherProps} />;
};

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

type ButtonProps = Props & TouchableNativeFeedbackSafe['props'];

// Extend this if you ever need to customize ripple color
function useRippleColor(_props: any) {
  const theme = useTheme();
  return theme.dark ? '#fff' : '#ccc';
}

export const StyledButton = (props: ButtonProps) => {
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
  const rippleColor = useRippleColor(props);

  return (
    <TouchableNativeFeedbackSafe
      background={TouchableNativeFeedbackSafe.Ripple(rippleColor, false)}
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

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth * 2,
    flex: 1,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  genericCardContainer: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  genericCardBody: {
    paddingTop: 20,
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 17,
  },
});
