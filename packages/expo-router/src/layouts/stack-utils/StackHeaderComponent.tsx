import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, useMemo, type ReactNode } from 'react';
import { StyleSheet, type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

import {
  appendStackHeaderBackButtonPropsToOptions,
  StackHeaderBackButton,
} from './StackHeaderBackButton';
import {
  appendStackHeaderLeftPropsToOptions,
  appendStackHeaderRightPropsToOptions,
  StackHeaderLeft,
  StackHeaderRight,
} from './StackHeaderLeftRight';
import { appendStackHeaderTitlePropsToOptions, StackHeaderTitle } from './StackHeaderTitle';
import { appendStackSearchBarPropsToOptions, StackSearchBar } from './StackSearchBar';
import { isChildOfType } from '../../utils/children';
import { Screen } from '../../views/Screen';

export interface StackHeaderProps {
  /**
   * Child elements to compose the header. Can include Stack.Header.Title, Stack.Header.Left,
   * Stack.Header.Right, Stack.Header.BackButton, and Stack.Header.SearchBar components.
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
 * The component used to configure the whole stack header.
 *
 * When used inside a screen, it allows you to customize the header dynamically by composing
 * header subcomponents (title, left/right areas, back button, search bar, etc.).
 *
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header>
 *         <Stack.Header.Title>Page title</Stack.Header.Title>
 *         <Stack.Header.Left>
 *           <Stack.Header.Button onPress={() => alert('Left pressed')} />
 *         </Stack.Header.Left>
 *         <Stack.Header.Right>
 *           <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *         </Stack.Header.Right>
 *       </Stack.Header>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside a layout, it needs to be wrapped in `Stack.Screen` to take effect.
 *
 * Example (inside a layout):
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Title>Layout title</Stack.Header.Title>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
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

  let updatedOptions: NativeStackNavigationOptions = {
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

  function appendChildOptions(child: React.ReactElement, options: NativeStackNavigationOptions) {
    let updatedOptions = options;
    if (isChildOfType(child, StackHeaderTitle)) {
      updatedOptions = appendStackHeaderTitlePropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderLeft)) {
      updatedOptions = appendStackHeaderLeftPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderRight)) {
      updatedOptions = appendStackHeaderRightPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderBackButton)) {
      updatedOptions = appendStackHeaderBackButtonPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackSearchBar)) {
      updatedOptions = appendStackSearchBarPropsToOptions(updatedOptions, child.props);
    } else {
      console.warn(
        `Warning: Unknown child element passed to Stack.Header: ${(child.type as { name: string }).name ?? child.type}`
      );
    }
    return updatedOptions;
  }

  Children.forEach(props.children, (child) => {
    if (isValidElement(child)) {
      updatedOptions = appendChildOptions(child, updatedOptions);
    }
  });

  return updatedOptions;
}
