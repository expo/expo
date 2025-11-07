import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';

export interface StackHeaderLeftProps {
  children?: ReactNode;
  asChild?: boolean;
}

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
