import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { useCompositionOption } from '../../../fork/native-stack/composition-options';
import { convertFontWeightToStringFontWeight } from '../../../utils/style';

export type StackScreenTitleProps = {
  /**
   * The title content. Pass a string for a plain text title,
   * or a custom component when `asChild` is enabled.
   */
  children?: React.ReactNode;
  /**
   * Use this to render a custom component as the header title.
   *
   * @example
   * ```tsx
   * <Stack.Screen.Title asChild>
   *   <MyCustomTitle />
   * </Stack.Screen.Title>
   * ```
   */
  asChild?: boolean;
  style?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: Exclude<TextStyle['fontWeight'], number>;
    // TODO(@ubax): This should be ColorValue, but react-navigation types
    // currently only accept string for color props. In RN v8 we can change this to ColorValue.
    color?: string;
    textAlign?: 'left' | 'center';
  }>;
  /**
   * Style properties for the large title header.
   *
   * @platform ios
   */
  largeStyle?: StyleProp<{
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: Exclude<TextStyle['fontWeight'], number>;
    // TODO(@ubax): This should be ColorValue, but react-navigation types
    // currently only accept string for color props. In RN v8 we can change this to ColorValue.
    color?: string;
  }>;
  /**
   * Enables large title mode.
   *
   * @platform ios
   */
  large?: boolean;
};

/**
 * Component to set the screen title.
 *
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
 *
 * @example
 * String title in a layout:
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
 * String title inside a screen:
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
 * @example
 * Custom component as the title using `asChild`:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Screen.Title asChild>
 *           <MyCustomTitle />
 *         </Stack.Screen.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export function StackScreenTitle({
  children,
  asChild,
  style,
  largeStyle,
  large,
}: StackScreenTitleProps) {
  const options = useMemo(
    () =>
      appendStackScreenTitlePropsToOptions(
        {},
        // satisfies ensures every prop is listed here
        { children, asChild, style, largeStyle, large } satisfies Record<
          keyof StackScreenTitleProps,
          unknown
        >
      ),
    [children, asChild, style, largeStyle, large]
  );
  useCompositionOption(options);
  return null;
}

export function appendStackScreenTitlePropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenTitleProps
): NativeStackNavigationOptions {
  const flattenedStyle = StyleSheet.flatten(props.style);
  const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);

  let titleOptions: NativeStackNavigationOptions = props.asChild
    ? { headerTitle: () => <>{props.children}</> }
    : { title: props.children as string | undefined };

  if (props.asChild && typeof props.children === 'string') {
    if (__DEV__) {
      console.warn(
        "Stack.Screen.Title: 'asChild' expects a custom component as children, string received."
      );
    }
    titleOptions = {};
  }
  if (!props.asChild && props.children != null && typeof props.children !== 'string') {
    if (__DEV__) {
      console.warn(
        'Stack.Screen.Title: Component passed to Stack.Screen.Title without `asChild` enabled. In order to render a custom component as the title, set `asChild` to true.'
      );
    }
    titleOptions = {};
  }

  return {
    ...options,
    ...titleOptions,
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
