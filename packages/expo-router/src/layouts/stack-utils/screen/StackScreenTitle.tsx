import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { convertFontWeightToStringFontWeight } from '../../../utils/style';
import { Screen } from '../../../views/Screen';

export type StackScreenTitleProps = {
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

/**
 * Component to set the screen title.
 *
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Screen.Title large>Home</Stack.Screen.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Screen.Title>My Page</Stack.Screen.Title>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export function StackScreenTitle(props: StackScreenTitleProps) {
  const updatedOptions = useMemo(() => appendStackScreenTitlePropsToOptions({}, props), [props]);
  return <Screen options={updatedOptions} />;
}

export function appendStackScreenTitlePropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenTitleProps
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
