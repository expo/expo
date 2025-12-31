import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import type { SearchBarProps } from 'react-native-screens';

import { Screen } from '../../views/Screen';

// TODO: Discuss adding SearchBarPlacement to react-native-screens header items
// and exposing it as Stack.Header.SearchBarPlacement
// https://linear.app/expo/issue/ENG-18555
export interface StackSearchBarProps extends SearchBarProps {}

export function StackSearchBar(props: StackSearchBarProps) {
  const updatedOptions = useMemo(
    () => appendStackSearchBarPropsToOptions({}, props),
    [props]
  );
  return <Screen options={updatedOptions} />;
}

export function appendStackSearchBarPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackSearchBarProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerSearchBarOptions: {
      ...props,
    },
  };
}
