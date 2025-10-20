import type { JSXElementConstructor, ReactNode } from 'react';
import React from 'react';
import type { ColorValue } from 'react-native';

import type { ExtendedNativeTabOptions, NativeTabsLabelStyle, NativeTabsProps } from './types';

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

export function convertLabelStylePropToObject(labelStyle: NativeTabsProps['labelStyle']): {
  default?: NativeTabsLabelStyle;
  selected?: NativeTabsLabelStyle;
} {
  if (labelStyle) {
    if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
      return labelStyle;
    }
    return {
      default: labelStyle as NativeTabsLabelStyle,
    };
  }
  return {};
}

export function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
  default?: ColorValue;
  selected?: ColorValue;
} {
  if (iconColor) {
    if (typeof iconColor === 'object' && ('default' in iconColor || 'selected' in iconColor)) {
      return iconColor;
    }
    return {
      default: iconColor as ColorValue,
    };
  }
  return {};
}
