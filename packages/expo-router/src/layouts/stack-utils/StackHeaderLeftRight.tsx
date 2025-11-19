import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { Fragment, isValidElement, type ReactNode } from 'react';

import {
  convertStackHeaderButtonPropsToRNHeaderItem,
  StackHeaderButton,
} from './StackHeaderButton';
import { convertStackHeaderItemPropsToRNHeaderItem, StackHeaderItem } from './StackHeaderItem';
import { convertStackHeaderMenuPropsToRNHeaderItem, StackHeaderMenu } from './StackHeaderMenu';
import {
  convertStackHeaderSpacingPropsToRNHeaderItem,
  StackHeaderSpacing,
} from './StackHeaderSpacing';
import { isChildOfType } from './utils';

export interface StackHeaderLeftProps {
  children?: ReactNode;
  asChild?: boolean;
}

export interface StackHeaderRightProps {
  children?: ReactNode;
  asChild?: boolean;
}

export function StackHeaderLeft(props: StackHeaderLeftProps) {
  return null;
}

export function StackHeaderRight(props: StackHeaderRightProps) {
  return null;
}

function convertHeaderRightLeftChildrenToUnstableItems(
  children: React.ReactNode,
  side: 'Left' | 'Right'
):
  | NativeStackNavigationOptions['unstable_headerRightItems']
  | NativeStackNavigationOptions['unstable_headerLeftItems'] {
  const allChildren = React.Children.toArray(children);
  const actions = allChildren.filter(
    (child) =>
      isChildOfType(child, StackHeaderButton) ||
      isChildOfType(child, StackHeaderMenu) ||
      isChildOfType(child, StackHeaderSpacing) ||
      isChildOfType(child, StackHeaderItem)
  );
  if (actions.length !== allChildren.length && process.env.NODE_ENV !== 'production') {
    const otherElements = allChildren
      .filter((child) => !actions.some((action) => action === child))
      .map((e) => {
        if (isValidElement(e)) {
          if (e.type === Fragment) {
            return '<Fragment>';
          } else {
            return (e.type as { name: string })?.name ?? e.type;
          }
        }

        return String(e);
      });
    console.warn(
      `Stack.Header.${side} only accepts <Stack.Header.Button>, <Stack.Header.Menu>, <Menu>, and <Stack.Header.Item> as children. Found invalid children: ${otherElements.join(', ')}`
    );
  }
  return () =>
    actions.map((action) => {
      if (isChildOfType(action, StackHeaderButton)) {
        return convertStackHeaderButtonPropsToRNHeaderItem(action.props);
      } else if (isChildOfType(action, StackHeaderMenu)) {
        return convertStackHeaderMenuPropsToRNHeaderItem(action.props);
      } else if (isChildOfType(action, StackHeaderSpacing)) {
        return convertStackHeaderSpacingPropsToRNHeaderItem(action.props);
      }
      return convertStackHeaderItemPropsToRNHeaderItem(action.props);
    });
}

export function appendStackHeaderRightPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderRightProps
): NativeStackNavigationOptions {
  if (props.asChild) {
    return {
      ...options,
      headerRight: () => props.children,
    };
  }

  return {
    ...options,
    unstable_headerRightItems: convertHeaderRightLeftChildrenToUnstableItems(
      props.children,
      'Right'
    ),
  };
}

export function appendStackHeaderLeftPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderLeftProps
): NativeStackNavigationOptions {
  if (props.asChild) {
    return {
      ...options,
      headerLeft: () => props.children,
    };
  }
  return {
    ...options,
    unstable_headerLeftItems: convertHeaderRightLeftChildrenToUnstableItems(props.children, 'Left'),
  };
}
