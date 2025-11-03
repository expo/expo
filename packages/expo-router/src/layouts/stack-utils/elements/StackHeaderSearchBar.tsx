import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { StackHeaderSearchBarProps } from '../types';

export function StackHeaderSearchBar(props: StackHeaderSearchBarProps) {
  return null;
}

export function appendStackHeaderSearchBarPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderSearchBarProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerSearchBarOptions: {
      ...props,
    },
  };
}
