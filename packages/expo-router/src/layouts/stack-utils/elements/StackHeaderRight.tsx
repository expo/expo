import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { StackHeaderRightProps } from '../types';

export function StackHeaderRight(props: StackHeaderRightProps) {
  return null;
}

export function appendStackHeaderRightPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderRightProps
): NativeStackNavigationOptions {
  if (!props.asChild) {
    return options;
  }

  return {
    ...options,
    headerRight: () => props.children,
  };
}
