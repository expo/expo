import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { SearchBarProps } from 'react-native-screens';

export interface StackHeaderSearchBarProps extends SearchBarProps {}

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
