import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { Fragment, isValidElement, type ReactNode } from 'react';
import { useMemo } from 'react';

import {
  convertStackHeaderButtonPropsToRNHeaderItem,
  StackHeaderButton,
} from './StackHeaderButton';
import { convertStackHeaderMenuPropsToRNHeaderItem, StackHeaderMenu } from './StackHeaderMenu';
import {
  convertStackHeaderSpacerPropsToRNHeaderItem,
  StackHeaderSpacer,
} from './StackHeaderSpacer';
import { convertStackHeaderViewPropsToRNHeaderItem, StackHeaderView } from './StackHeaderView';
import { isChildOfType } from '../../utils/children';
import { Screen } from '../../views/Screen';

export interface StackHeaderLeftProps {
  /**
   * Child elements to compose the left area of the header. Can include Stack.Header.Button,
   * Stack.Header.Menu, Stack.Header.Item, and Stack.Header.Spacer components.
   */
  children?: ReactNode;
  /**
   * When `true`, renders children as a custom component in the header left area,
   * replacing the default header left layout.
   *
   * @default false
   */
  asChild?: boolean;
}

export interface StackHeaderRightProps {
  /**
   * Child elements to compose the right area of the header. Can include Stack.Header.Button,
   * Stack.Header.Menu, Stack.Header.Item, and Stack.Header.Spacer components.
   */
  children?: ReactNode;
  /**
   * When `true`, renders children as a custom component in the header right area,
   * replacing the default header right layout.
   *
   * @default false
   */
  asChild?: boolean;
}

/**
 * The component used to configure the left area of the stack header.
 *
 * When used inside a screen, it allows you to customize the left side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Left>
 *         <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *       </Stack.Header.Left>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export const StackHeaderLeft: React.FC<StackHeaderLeftProps> = (props) => {
  // This component will only render when used inside a page
  // but only if it is not wrapped in Stack.Screen.Header
  const updatedOptions = useMemo(() => appendStackHeaderLeftPropsToOptions({}, props), [props]);
  return <Screen options={updatedOptions} />;
};

/**
 * The component used to configure the right area of the stack header.
 *
 * When used inside a screen, it allows you to customize the right side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Right>
 *         <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *       </Stack.Header.Right>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export const StackHeaderRight: React.FC<StackHeaderRightProps> = (props) => {
  // This component will only render when used inside a page
  // but only if it is not wrapped in Stack.Screen.Header
  const updatedOptions = useMemo(() => appendStackHeaderRightPropsToOptions({}, props), [props]);
  return <Screen options={updatedOptions} />;
};

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
      isChildOfType(child, StackHeaderSpacer) ||
      isChildOfType(child, StackHeaderView)
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
    actions
      .map((action) => {
        if (isChildOfType(action, StackHeaderButton)) {
          return convertStackHeaderButtonPropsToRNHeaderItem(action.props);
        } else if (isChildOfType(action, StackHeaderMenu)) {
          return convertStackHeaderMenuPropsToRNHeaderItem(action.props);
        } else if (isChildOfType(action, StackHeaderSpacer)) {
          return convertStackHeaderSpacerPropsToRNHeaderItem(action.props);
        }
        return convertStackHeaderViewPropsToRNHeaderItem(action.props);
      })
      .filter((item) => !!item);
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
