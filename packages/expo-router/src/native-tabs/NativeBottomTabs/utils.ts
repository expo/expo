import type { JSXElementConstructor, ReactNode } from 'react';
import React from 'react';

import type { ExtendedNativeTabOptions, TypeOrRecord } from './types';

export function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(
  children: ReactNode | ReactNode[],
  components: Components
): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[] {
  return React.Children.toArray(children).filter(
    (
      child
    ): child is React.ReactElement<React.ComponentProps<Components[number]>, Components[number]> =>
      React.isValidElement(child) && components.includes(child.type as (props: any) => ReactNode)
  );
}

export function isChildOfType<T extends JSXElementConstructor<any>>(
  child: ReactNode,
  type: T
): child is React.ReactElement<React.ComponentProps<T>, T> {
  return React.isValidElement(child) && child.type === type;
}

export function shouldTabBeVisible(options: ExtendedNativeTabOptions): boolean {
  // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
  // If it is not defined, then it was not specified, and we should hide the tab.
  return options.hidden === false;
}

export function getValueFromTypeOrRecord<T, K extends string>(
  value: TypeOrRecord<T, K> | undefined,
  key: K
): T | undefined {
  if (value && typeof value === 'object' && key in value) {
    return (value as { [k in K]: T })[key];
  }
  return value as T | undefined;
}
