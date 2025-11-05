import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StyleSheet, type TextStyle } from 'react-native';

import type { StackHeaderTitleProps } from '../types';

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

function convertFontWeightToStringFontWeight(
  fontWeight: TextStyle['fontWeight']
): Exclude<TextStyle['fontWeight'], number> | undefined {
  if (typeof fontWeight === 'number') {
    return String(fontWeight) as `${Extract<TextStyle['fontWeight'], number>}`;
  }
  return fontWeight;
}
