import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { StackHeaderLeftProps } from '../types';

export function StackHeaderLeft(props: StackHeaderLeftProps) {
  return null;
}

export function appendStackHeaderLeftPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderLeftProps
): NativeStackNavigationOptions {
  if (!props.asChild) {
    return options;
  }

  return {
    ...options,
    headerLeft: () => props.children,
  };
}
