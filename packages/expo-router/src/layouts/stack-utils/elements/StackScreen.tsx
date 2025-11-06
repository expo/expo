'use client';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, useMemo } from 'react';

import { StackHeaderComponent, appendStackHeaderPropsToOptions } from './StackHeaderComponent';
import { Screen } from '../../../views/Screen';
import type { StackScreenProps, StackHeaderProps } from '../types';

export function StackScreen({ children, options, ...rest }: StackScreenProps) {
  // This component will only render when used inside a page.
  const updatedOptions = useMemo(
    () =>
      appendScreenStackPropsToOptions(options ?? {}, {
        children,
      }),
    [options, children]
  );
  return <Screen {...rest} options={updatedOptions} />;
}

export function appendScreenStackPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenProps
): NativeStackNavigationOptions {
  let updatedOptions = { ...options, ...props.options };
  function appendChildOptions(child: React.ReactElement, options: NativeStackNavigationOptions) {
    if (child.type === StackHeaderComponent) {
      updatedOptions = appendStackHeaderPropsToOptions(options, child.props as StackHeaderProps);
    } else {
      console.warn(
        `Warning: Unknown child element passed to Stack.Screen: ${(child.type as { name: string }).name ?? child.type}`
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
