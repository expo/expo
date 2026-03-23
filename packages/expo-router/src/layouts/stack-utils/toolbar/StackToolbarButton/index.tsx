'use client';
import { Children, useMemo } from 'react';

import { NativeToolbarButton } from './native';
import type { StackToolbarButtonProps } from './types';
import type { NativeStackHeaderItemButton } from '../../../../react-navigation/native-stack';
import { filterAllowedChildrenElements, getFirstChildOfType } from '../../../../utils/children';
import { useToolbarPlacement } from '../context';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  extractIconRenderingMode,
  extractXcassetName,
} from '../shared';
import { StackToolbarLabel, StackToolbarIcon, StackToolbarBadge } from '../toolbar-primitives';

export type { StackToolbarButtonProps, NativeToolbarButtonProps } from './types';

/**
 * A button used inside `Stack.Toolbar`.
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
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
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
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarButton: React.FC<StackToolbarButtonProps> = (props) => {
  const placement = useToolbarPlacement();

  const validChildren = useMemo(
    () => filterAllowedChildrenElements(props.children, ALLOWED_CHILDREN),
    [props.children]
  );

  if (process.env.NODE_ENV !== 'production') {
    // Skip validation for string children
    if (typeof props.children !== 'string') {
      const allChildren = Children.toArray(props.children);
      if (allChildren.length !== validChildren.length) {
        throw new Error(
          `Stack.Toolbar.Button only accepts a single string or Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`
        );
      }
    }
  }

  if (process.env.NODE_ENV !== 'production' && placement === 'bottom') {
    const hasBadge = getFirstChildOfType(props.children, StackToolbarBadge);
    if (hasBadge) {
      console.warn(
        'Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.'
      );
    }
  }

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.Button must be used inside a Stack.Toolbar');
  }

  const sharedProps = convertStackHeaderSharedPropsToRNSharedHeaderItem(props, true);
  // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
  const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
  const source = sharedProps?.icon?.type === 'image' ? sharedProps.icon.source : undefined;
  const xcassetName = extractXcassetName(props);
  const imageRenderingMode = extractIconRenderingMode(props) ?? props.iconRenderingMode;
  return (
    <NativeToolbarButton
      {...sharedProps}
      icon={icon}
      source={source}
      xcassetName={xcassetName}
      image={props.image}
      imageRenderingMode={imageRenderingMode}
    />
  );
};

export function convertStackToolbarButtonPropsToRNHeaderItem(
  props: StackToolbarButtonProps
): NativeStackHeaderItemButton | undefined {
  if (props.hidden) {
    return undefined;
  }

  return {
    ...convertStackHeaderSharedPropsToRNSharedHeaderItem(props),
    type: 'button',
    onPress: props.onPress ?? (() => {}),
    selected: !!props.selected,
  };
}

const ALLOWED_CHILDREN = [StackToolbarLabel, StackToolbarIcon, StackToolbarBadge];
