'use client';
import type { NativeStackHeaderItemSpacing } from '@react-navigation/native-stack';
import { useId } from 'react';

import { useToolbarPlacement } from './context';
import { RouterToolbarItem } from '../../../toolbar/native';

export interface StackToolbarSpacerProps {
  /**
   * Whether the spacer should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  // TODO(@ubax): implement fluid spacing in react-native-screens
  /**
   * The width of the spacing element.
   *
   * In Left/Right placements, width is required.
   * In Bottom placement, if width is not provided, the spacer will be flexible
   * and expand to fill available space.
   */
  width?: number;
  // TODO(@ubax): implement missing props in react-native-screens
  /**
   * Whether this spacer shares background with adjacent items.
   *
   * Only available in bottom placement.
   *
   * @platform iOS 26+
   */
  sharesBackground?: boolean;
}

/**
 * A spacing helper used inside `Stack.Toolbar` to create empty space between toolbar items.
 *
 * In left/right placements, width is required.
 * In bottom placement, if width is not provided, creates a flexible spacer that expands to fill space.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left" />
 *         <Stack.Toolbar.Spacer width={8} />
 *         <Stack.Toolbar.Button icon="arrow.right" />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
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
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="search" />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarSpacer: React.FC<StackToolbarSpacerProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.Spacer must be used inside a Stack.Toolbar');
  }

  return <NativeToolbarSpacer {...props} hidesSharedBackground={!props.sharesBackground} />;
};

export function convertStackToolbarSpacerPropsToRNHeaderItem(
  props: StackToolbarSpacerProps
): NativeStackHeaderItemSpacing | undefined {
  const { hidden, width } = props;

  if (hidden) {
    return undefined;
  }

  // Warn if using flexible spacer in Left/Right placement
  if (width === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.Spacer requires `width` when used in left or right placement. Flexible spacers are only supported in Bottom placement.'
      );
    }
    return undefined;
  }

  return {
    type: 'spacing',
    spacing: width ?? 0,
  };
}

// #region NativeToolbarSpacer

interface NativeToolbarSpacerProps {
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  sharesBackground?: boolean;
  width?: number;
}

/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  const id = useId();
  return (
    <RouterToolbarItem
      hidesSharedBackground={props.hidesSharedBackground}
      hidden={props.hidden}
      identifier={id}
      sharesBackground={props.sharesBackground}
      type={props.width ? 'fixedSpacer' : 'fluidSpacer'}
      width={props.width}
    />
  );
};

// #endregion
