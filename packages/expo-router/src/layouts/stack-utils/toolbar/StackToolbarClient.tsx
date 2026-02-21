'use client';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { Fragment, isValidElement, useMemo, type ReactNode } from 'react';

import {
  convertStackToolbarButtonPropsToRNHeaderItem,
  StackToolbarButton,
} from './StackToolbarButton';
import {
  convertStackToolbarMenuPropsToRNHeaderItem,
  StackToolbarMenu,
  StackToolbarMenuAction,
} from './StackToolbarMenu';
import { StackToolbarSearchBarSlot } from './StackToolbarSearchBarSlot';
import {
  convertStackToolbarSpacerPropsToRNHeaderItem,
  StackToolbarSpacer,
} from './StackToolbarSpacer';
import { convertStackToolbarViewPropsToRNHeaderItem, StackToolbarView } from './StackToolbarView';
import { ToolbarPlacementContext, useToolbarPlacement, type ToolbarPlacement } from './context';
import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './toolbar-primitives';
import { useCompositionOption } from '../../../fork/native-stack/composition-options';
import { NativeMenuContext } from '../../../link/NativeMenuContext';
import { RouterToolbarHost } from '../../../toolbar/native';
import { isChildOfType } from '../../../utils/children';

export interface StackToolbarProps {
  /**
   * Child elements to compose the toolbar. Can include Stack.Toolbar.Button,
   * Stack.Toolbar.Menu, Stack.Toolbar.View, Stack.Toolbar.Spacer, and
   * Stack.Toolbar.SearchBarSlot (bottom only) components.
   */
  children?: ReactNode;
  /**
   * The placement of the toolbar.
   *
   * - `'left'`: Renders items in the left area of the header.
   * - `'right'`: Renders items in the right area of the header.
   * - `'bottom'`: Renders items in the bottom toolbar (iOS only).
   *
   * @default 'bottom'
   */
  placement?: ToolbarPlacement;
  /**
   * When `true`, renders children as a custom component in the header area,
   * replacing the default header layout.
   *
   * Only applies to `placement="left"` and `placement="right"`.
   *
   * @default false
   */
  asChild?: boolean;
}

/**
 * The component used to configure the stack toolbar.
 *
 * - Use `placement="left"` to customize the left side of the header.
 * - Use `placement="right"` to customize the right side of the header.
 * - Use `placement="bottom"` (default) to show a bottom toolbar (iOS only).
 *
 * > **Note:** Using `Stack.Toolbar` with `placement="left"` or `placement="right"` will
 * automatically make the header visible (`headerShown: true`), as the toolbar is rendered
 * as part of the native header.
 *
 * > **Note:** `Stack.Toolbar` with `placement="bottom"` can only be used inside **page**
 * components, not in layout components.
 *
 * > **Note**: Stack.Toolbar is an experimental API and may change without notice.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *         </Stack.Toolbar>
 *         <Stack.Toolbar placement="right">
 *           <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => alert('Right button pressed!')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *       </Stack.Toolbar>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="magnifyingglass" onPress={() => {}} />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export const StackToolbar = (props: StackToolbarProps) => {
  const parentPlacement = useToolbarPlacement();
  if (parentPlacement) {
    throw new Error(`Stack.Toolbar cannot be nested inside another Stack.Toolbar.`);
  }

  if (props.placement === 'bottom' || !props.placement) {
    return <StackToolbarBottom {...props} />;
  }

  return <StackToolbarHeader {...props} key={props.placement} />;
};

const StackToolbarBottom = ({ children }: StackToolbarProps) => {
  return (
    <ToolbarPlacementContext.Provider value="bottom">
      <NativeMenuContext value>
        <RouterToolbarHost>{children}</RouterToolbarHost>
      </NativeMenuContext>
    </ToolbarPlacementContext.Provider>
  );
};

const StackToolbarHeader = ({ children, placement, asChild }: StackToolbarProps) => {
  if (placement !== 'left' && placement !== 'right') {
    throw new Error(
      `Invalid placement "${placement}" for Stack.Toolbar. Expected "left" or "right".`
    );
  }

  const options = useMemo(
    () =>
      appendStackToolbarPropsToOptions(
        {},
        // satisfies ensures every prop is listed here
        { children, placement, asChild } satisfies Record<keyof StackToolbarProps, unknown>
      ),
    [children, placement, asChild]
  );
  useCompositionOption(options);

  return null;
};

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

export function appendStackToolbarPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackToolbarProps
): NativeStackNavigationOptions {
  const { children, placement = 'bottom', asChild } = props;

  if (placement === 'bottom') {
    // Bottom toolbar doesn't modify navigation options
    return options;
  }

  if (asChild) {
    if (placement === 'left') {
      return {
        ...options,
        headerShown: true,
        headerLeft: () => children,
      };
    } else {
      return {
        ...options,
        headerShown: true,
        headerRight: () => children,
      };
    }
  }

  if (placement === 'left') {
    return {
      ...options,
      headerShown: true,
      unstable_headerLeftItems: convertToolbarChildrenToUnstableItems(children, 'left'),
    };
  }

  return {
    ...options,
    headerShown: true,
    unstable_headerRightItems: convertToolbarChildrenToUnstableItems(children, 'right'),
  };
}

StackToolbar.Button = StackToolbarButton;
StackToolbar.Menu = StackToolbarMenu;
StackToolbar.MenuAction = StackToolbarMenuAction;
StackToolbar.SearchBarSlot = StackToolbarSearchBarSlot;
StackToolbar.Spacer = StackToolbarSpacer;
StackToolbar.View = StackToolbarView;
StackToolbar.Label = StackToolbarLabel;
StackToolbar.Icon = StackToolbarIcon;
StackToolbar.Badge = StackToolbarBadge;

export default StackToolbar;
