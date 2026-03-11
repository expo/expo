'use client';
import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { Children, useId, useMemo, type ReactNode } from 'react';
import { StyleSheet, type ColorValue, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useToolbarPlacement } from './context';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  extractIconRenderingMode,
  extractXcassetName,
  type StackHeaderItemSharedProps,
} from './shared';
import { StackToolbarLabel, StackToolbarIcon, StackToolbarBadge } from './toolbar-primitives';
import { RouterToolbarItem } from '../../../toolbar/native';
import { filterAllowedChildrenElements, getFirstChildOfType } from '../../../utils/children';
import type { BasicTextStyle } from '../../../utils/font';

export interface StackToolbarButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * There are two ways to specify the content of the button:
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * export default function Page() {
   *   return (
   *     <>
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button icon="star.fill">As text passed as children</Stack.Toolbar.Button>
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
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button>
   *           <Stack.Toolbar.Icon sf="star.fill" />
   *           <Stack.Toolbar.Label>As components</Stack.Toolbar.Label>
   *           <Stack.Toolbar.Badge>3</Stack.Toolbar.Badge>
   *         </Stack.Toolbar.Button>
   *       </Stack.Toolbar>
   *       <ScreenContent />
   *     </>
   *   );
   * }
   * ```
   *
   * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only. Badge is only supported in left/right placements, not in bottom (iOS toolbar limitation).
   */
  children?: ReactNode;
  disabled?: boolean;
  /**
   * Whether the button should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Whether to hide the shared background.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Icon to display in the button.
   *
   * Can be a string representing an SFSymbol or an image source.
   *
   * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
   */
  icon?: StackHeaderItemSharedProps['icon'];
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display in the button.
   *
   * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
   */
  image?: ImageRef;
  /**
   * Controls how image-based icons are rendered on iOS.
   *
   * - `'template'`: iOS applies tint color to the icon
   * - `'original'`: Preserves original icon colors (useful for multi-color icons)
   *
   * **Default behavior:**
   * - If `tintColor` is specified, defaults to `'template'`
   * - If no `tintColor`, defaults to `'original'`
   *
   * This prop only affects image-based icons (not SF Symbols).
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   *
   * @platform ios
   */
  iconRenderingMode?: 'template' | 'original';
  onPress?: () => void;
  /**
   * Whether to separate the background of this item from other header items.
   *
   * @default false
   */
  separateBackground?: boolean;
  /**
   * Whether the button is in a selected state
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
   */
  selected?: boolean;
  /**
   * Style for the label of the header item.
   */
  style?: StyleProp<TextStyle>;
  /**
   * The tint color to apply to the button item
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
   */
  tintColor?: StackHeaderItemSharedProps['tintColor'];
  /**
   * @default 'plain'
   */
  variant?: StackHeaderItemSharedProps['variant'];
}

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
  const xcassetName = extractXcassetName(props);
  const imageRenderingMode = extractIconRenderingMode(props) ?? props.iconRenderingMode;
  return (
    <NativeToolbarButton
      {...sharedProps}
      icon={icon}
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

// #region NativeToolbarButton

interface NativeToolbarButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  icon?: SFSymbol;
  xcassetName?: string;
  image?: ImageRef;
  imageRenderingMode?: 'template' | 'original';
  onPress?: () => void;
  possibleTitles?: string[];
  selected?: boolean;
  separateBackground?: boolean;
  style?: StyleProp<BasicTextStyle>;
  tintColor?: ColorValue;
  variant?: 'plain' | 'done' | 'prominent';
  label?: string;
}

/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
const NativeToolbarButton: React.FC<NativeToolbarButtonProps> = (props) => {
  const id = useId();
  const renderingMode =
    props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
  return (
    <RouterToolbarItem
      accessibilityHint={props.accessibilityHint}
      accessibilityLabel={props.accessibilityLabel}
      barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant}
      disabled={props.disabled}
      hidden={props.hidden}
      hidesSharedBackground={props.hidesSharedBackground}
      identifier={id}
      image={props.image}
      imageRenderingMode={renderingMode}
      onSelected={props.onPress}
      possibleTitles={props.possibleTitles}
      selected={props.selected}
      sharesBackground={!props.separateBackground}
      systemImageName={props.icon}
      xcassetName={props.xcassetName}
      title={props.label}
      tintColor={props.tintColor}
      titleStyle={StyleSheet.flatten(props.style)}
    />
  );
};

// #endregion
