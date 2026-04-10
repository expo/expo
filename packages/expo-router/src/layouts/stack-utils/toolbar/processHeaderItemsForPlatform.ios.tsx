import React, { Fragment, isValidElement, type ReactNode } from 'react';

import {
  convertStackToolbarButtonPropsToRNHeaderItem,
  StackToolbarButton,
} from './StackToolbarButton';
import { convertStackToolbarMenuPropsToRNHeaderItem, StackToolbarMenu } from './StackToolbarMenu';
import {
  convertStackToolbarSpacerPropsToRNHeaderItem,
  StackToolbarSpacer,
} from './StackToolbarSpacer';
import { convertStackToolbarViewPropsToRNHeaderItem, StackToolbarView } from './StackToolbarView';
import type { ToolbarColors, ToolbarPlacement } from './context';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
import { isChildOfType } from '../../../utils/children';

function convertToolbarChildrenToUnstableItems(
  children: React.ReactNode,
  side: 'left' | 'right'
):
  | NativeStackNavigationOptions['unstable_headerRightItems']
  | NativeStackNavigationOptions['unstable_headerLeftItems'] {
  const allChildren = React.Children.toArray(children);
  const actions = allChildren.filter(
    (child) =>
      isChildOfType(child, StackToolbarButton) ||
      isChildOfType(child, StackToolbarMenu) ||
      isChildOfType(child, StackToolbarSpacer) ||
      isChildOfType(child, StackToolbarView)
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
      `Stack.Toolbar with placement="${side}" only accepts <Stack.Toolbar.Button>, <Stack.Toolbar.Menu>, <Stack.Toolbar.View>, and <Stack.Toolbar.Spacer> as children. Found invalid children: ${otherElements.join(', ')}`
    );
  }
  return () =>
    actions
      .map((action) => {
        if (isChildOfType(action, StackToolbarButton)) {
          return convertStackToolbarButtonPropsToRNHeaderItem(action.props);
        } else if (isChildOfType(action, StackToolbarMenu)) {
          return convertStackToolbarMenuPropsToRNHeaderItem(action.props);
        } else if (isChildOfType(action, StackToolbarSpacer)) {
          return convertStackToolbarSpacerPropsToRNHeaderItem(action.props);
        }
        return convertStackToolbarViewPropsToRNHeaderItem(action.props);
      })
      .filter((item) => !!item);
}

/**
 * On iOS, left/right toolbar items are converted to `unstable_headerLeftItems`/`unstable_headerRightItems`
 * which react-native-screens processes natively.
 */
export function processHeaderItemsForPlatform(
  children: ReactNode,
  placement: ToolbarPlacement,
  _colors?: ToolbarColors
): NativeStackNavigationOptions | null {
  if (placement !== 'left' && placement !== 'right') {
    return null;
  }

  if (placement === 'left') {
    return {
      headerShown: true,
      unstable_headerLeftItems: convertToolbarChildrenToUnstableItems(children, 'left'),
    };
  }

  return {
    headerShown: true,
    unstable_headerRightItems: convertToolbarChildrenToUnstableItems(children, 'right'),
  };
}
