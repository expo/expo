import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { convertFontWeightToStringFontWeight } from '../../utils/style';

export type StackHeaderTitleProps = {
  children?: string;
  style?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: Exclude<TextStyle['fontWeight'], number>;
    // TODO(@ubax): This should be ColorValue, but react-navigation types
    // currently only accept string for color props. In RN v8 we can change this to ColorValue.
    color?: string;
    textAlign?: 'left' | 'center';
  }>;
  largeStyle?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: Exclude<TextStyle['fontWeight'], number>;
    // TODO(@ubax): This should be ColorValue, but react-navigation types
    // currently only accept string for color props. In RN v8 we can change this to ColorValue.
    color?: string;
  }>;
  large?: boolean;
};

export function StackHeaderTitle(props: StackHeaderTitleProps) {
  return null;
}

export function appendStackHeaderTitlePropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderTitleProps
): NativeStackNavigationOptions {
  const flattenedStyle = StyleSheet.flatten(props.style);
  const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);

  return {
    ...options,
    title: props.children,
    headerLargeTitle: props.large,
    headerTitleAlign: flattenedStyle?.textAlign,
    headerTitleStyle: {
      ...flattenedStyle,
      ...(flattenedStyle?.fontWeight
        ? {
            fontWeight: convertFontWeightToStringFontWeight(flattenedStyle?.fontWeight),
          }
        : {}),
    },
    headerLargeTitleStyle: {
      ...flattenedLargeStyle,
      ...(flattenedLargeStyle?.fontWeight
        ? {
            fontWeight: convertFontWeightToStringFontWeight(flattenedLargeStyle?.fontWeight),
          }
        : {}),
    },
  };
}
