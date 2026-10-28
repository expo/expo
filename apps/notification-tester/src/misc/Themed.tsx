import DefaultAntDesign from '@expo/vector-icons/AntDesign';
import Color from 'color';
import {
  useColorScheme,
  Text as DefaultText,
  View as DefaultView,
  SectionList as DefaultSectionList,
  TextInput as DefaultTextInput,
} from 'react-native';
import {
  FlatList as DefaultFlatList,
  ScrollView as DefaultScrollView,
} from 'react-native-gesture-handler';

import { ThemeColors } from './colors';

export function useTheme(): 'light' | 'dark' {
  const colorScheme = useColorScheme();
  if (colorScheme === null) {
    return 'light';
  } else {
    return colorScheme;
  }
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof ThemeColors.light & keyof typeof ThemeColors.dark
) {
  const theme = useTheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return ThemeColors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

type LayeredThemeProps = {
  lightTextColor?: string;
  darkTextColor?: string;
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
};

export type TextProps = ThemeProps & React.ComponentProps<typeof DefaultText>;
export type ViewProps = ThemeProps & React.ComponentProps<typeof DefaultView>;
export type ScrollViewProps = ThemeProps & React.ComponentProps<typeof DefaultScrollView>;
export type FlatListProps = ThemeProps & React.ComponentProps<typeof DefaultFlatList>;
export type SectionListProps = ThemeProps & React.ComponentProps<typeof DefaultSectionList>;
export type AntDesignProps = ThemeProps & React.ComponentProps<typeof DefaultAntDesign>;
export type TextInputProps = LayeredThemeProps & React.ComponentProps<typeof DefaultTextInput>;

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'view');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function AntDesign(props: AntDesignProps) {
  const { lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');

  return <DefaultAntDesign color={color} {...otherProps} />;
}

function ScrollView(props: ScrollViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'view');

  return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

function FlatList(props: FlatListProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'view');

  return <DefaultFlatList style={[{ backgroundColor }, style]} {...otherProps} />;
}

function SectionList(props: SectionListProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'view');

  return <DefaultSectionList style={[{ backgroundColor }, style]} {...otherProps} />;
}

function TextInput(props: TextInputProps) {
  const {
    style,
    lightTextColor,
    darkTextColor,
    lightBackgroundColor,
    darkBackgroundColor,
    ...otherProps
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightBackgroundColor, dark: darkBackgroundColor },
    'textInputBackground'
  );

  const color = useThemeColor({ light: lightTextColor, dark: darkTextColor }, 'textInputText');

  const placeholderTextColor = Color(color).alpha(0.3).toString();

  return (
    <DefaultTextInput
      style={[{ backgroundColor, color }, style]}
      placeholderTextColor={placeholderTextColor}
      {...otherProps}
    />
  );
}

export { FlatList, SectionList, ScrollView, TextInput };
