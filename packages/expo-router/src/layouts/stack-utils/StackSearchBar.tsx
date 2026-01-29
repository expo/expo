import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import type { SearchBarProps } from 'react-native-screens';

import { Screen } from '../../views/Screen';

// TODO: Discuss adding SearchBarSlot to react-native-screens header items
// and exposing it as Stack.Header.SearchBarPreferredSlot
// https://linear.app/expo/issue/ENG-18555
export interface StackSearchBarProps extends SearchBarProps {}

/**
 * A search bar component that integrates with the native stack header.
 *
 * > **Note:** Using `Stack.SearchBar` will automatically make the header visible
 * (`headerShown: true`), as the search bar is rendered as part of the native header.
 *
 * To display the search bar in the bottom toolbar on iOS 26+, use
 * `Stack.Toolbar.SearchBarSlot` inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.SearchBar
 *         placeholder="Search..."
 *         onChangeText={(text) => console.log(text)}
 *       />
 *      <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 */
export function StackSearchBar(props: StackSearchBarProps) {
  const updatedOptions = useMemo(() => appendStackSearchBarPropsToOptions({}, props), [props]);
  return <Screen options={updatedOptions} />;
}

export function appendStackSearchBarPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackSearchBarProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerShown: true,
    headerSearchBarOptions: {
      ...props,
    },
  };
}
