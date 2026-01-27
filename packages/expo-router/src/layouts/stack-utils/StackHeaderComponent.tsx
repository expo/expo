import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

import { Screen } from '../../views/Screen';

export interface StackHeaderProps {
  /**
   * Child elements for custom header when `asChild` is true.
   */
  children?: ReactNode;
  /**
   * Whether to hide the header completely. When set to `true`, the header will not be rendered.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * When `true`, renders children as a custom header component, replacing the default header entirely.
   * Use this to implement fully custom header layouts.
   *
   * @default false
   */
  asChild?: boolean;
  /**
   * The blur effect to apply to the header background on iOS.
   * Common values include 'regular', 'prominent', 'systemMaterial', etc.
   *
   * @platform ios
   */
  blurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
  /**
   * Style properties for the standard-sized header.
   * - `color`: Tint color for header elements (similar to tintColor in React Navigation)
   * - `backgroundColor`: Background color of the header
   * - `shadowColor`: Set to 'transparent' to hide the header shadow/border
   */
  style?: StyleProp<{
    color?: ColorValue; // tintColor from ReactNavigation
    backgroundColor?: ScreenStackHeaderConfigProps['backgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
  /**
   * Style properties for the large title header (iOS).
   * - `backgroundColor`: Background color of the large title header
   * - `shadowColor`: Set to 'transparent' to hide the large title shadow/border
   *
   * @platform ios
   */
  largeStyle?: StyleProp<{
    backgroundColor?: ScreenStackHeaderConfigProps['largeTitleBackgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
}

/**
 * The component used to configure header styling for a stack screen.
 *
 * Use this component to set header appearance properties like blur effect, background color,
 * and shadow visibility.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header
 *         blurEffect="systemMaterial"
 *         style={{ backgroundColor: '#fff' }}
 *       />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * When used inside a layout with Stack.Screen:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header blurEffect="systemMaterial" />
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export function StackHeaderComponent(props: StackHeaderProps) {
  // This component will only render when used inside a page
  // but only if it is not wrapped in Stack.Screen
  const updatedOptions = useMemo(() => appendStackHeaderPropsToOptions({}, props), [props]);
  return <Screen options={updatedOptions} />;
}

export function appendStackHeaderPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderProps
): NativeStackNavigationOptions {
  const flattenedStyle = StyleSheet.flatten(props.style);
  const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);

  if (props.hidden) {
    return { ...options, headerShown: false };
  }

  if (props.asChild) {
    return { ...options, header: () => props.children };
  }

  if (props.children && !props.asChild) {
    console.warn(`To render a custom header, set the 'asChild' prop to true on Stack.Header.`);
  }

  return {
    ...options,
    headerShown: !props.hidden,
    headerBlurEffect: props.blurEffect,
    headerStyle: {
      backgroundColor: flattenedStyle?.backgroundColor as string | undefined,
    },
    headerLargeStyle: {
      backgroundColor: flattenedLargeStyle?.backgroundColor as string | undefined,
    },
    headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
    headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
  };
}
