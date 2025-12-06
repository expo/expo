import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';

export interface StackHeaderRightProps {
  children?: ReactNode;
  asChild?: boolean;
}

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
