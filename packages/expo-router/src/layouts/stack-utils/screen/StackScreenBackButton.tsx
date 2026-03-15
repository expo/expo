import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

import { useCompositionOption } from '../../../fork/native-stack/composition-options';

export interface StackScreenBackButtonProps {
  /**
   * The title to display for the back button.
   */
  children?: string | undefined;
  /**
   * Style for the back button title.
   */
  style?: NativeStackNavigationOptions['headerBackTitleStyle'] | undefined;
  /**
   * Whether to show a context menu when long pressing the back button.
   *
   * @platform ios
   */
  withMenu?: boolean | undefined;
  /**
   * The display mode for the back button.
   *
   * @platform ios
   */
  displayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'] | undefined;
  /**
   * Whether to hide the back button.
   */
  hidden?: boolean | undefined;
  /**
   * Custom image source for the back button.
   */
  src?: ImageSourcePropType | undefined;
}

/**
 * Component to configure the back button.
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
 *       <Stack.Screen name="detail">
 *         <Stack.Screen.BackButton displayMode="minimal">Back</Stack.Screen.BackButton>
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
 *       <Stack.Screen.BackButton hidden />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export function StackScreenBackButton({
  children,
  style,
  withMenu,
  displayMode,
  hidden,
  src,
}: StackScreenBackButtonProps) {
  const options = useMemo(
    () =>
      appendStackScreenBackButtonPropsToOptions(
        {},
        // satisfies ensures every prop is listed here
        { children, style, withMenu, displayMode, hidden, src } satisfies Record<
          keyof StackScreenBackButtonProps,
          unknown
        >
      ),
    [children, style, withMenu, displayMode, hidden, src]
  );
  useCompositionOption(options);
  return null;
}

export function appendStackScreenBackButtonPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenBackButtonProps
): NativeStackNavigationOptions {
  // @ts-expect-error -- react-native-screens types are not exactOptionalPropertyTypes-compatible
  return {
    ...options,
    headerBackTitle: props.children,
    headerBackTitleStyle: props.style,
    headerBackImageSource: props.src,
    headerBackButtonDisplayMode: props.displayMode,
    headerBackButtonMenuEnabled: props.withMenu,
    headerBackVisible: !props.hidden,
  };
}
