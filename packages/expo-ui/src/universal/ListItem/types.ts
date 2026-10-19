import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';

import type { ModifierConfig } from '../../types';

/**
 * Colors for a `ListItem`'s row elements, matching Jetpack Compose's
 * `ListItemDefaults.colors()` on Android.
 * @platform android
 */
export interface ListItemColors {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  leadingContentColor?: ColorValue;
  trailingContentColor?: ColorValue;
  supportingContentColor?: ColorValue;
  overlineContentColor?: ColorValue;
}

/**
 * Props for the [`ListItem.Leading`](#listitemleading) slot marker.
 */
export interface ListItemLeadingProps {
  /** Content rendered in the leading (start) slot. */
  children?: ReactNode;
}

/**
 * Props for the [`ListItem.Trailing`](#listitemtrailing) slot marker.
 */
export interface ListItemTrailingProps {
  /** Content rendered in the trailing (end) slot. */
  children?: ReactNode;
}

/**
 * Props for the [`ListItem.Supporting`](#listitemsupporting) slot marker.
 */
export interface ListItemSupportingProps {
  /** Content rendered below the headline. */
  children?: ReactNode;
}

/**
 * Props for the [`ListItem`](#listitem) component.
 * A tappable row in a list.
 */
export interface ListItemProps {
  /**
   * Headline content of the row.
   * The remaining (non-slot) children are rendered in the headline area.
   */
  children?: ReactNode;

  /**
   * Tap handler.
   * Activates over the entire row rectangle, including the empty gap between leading/headline/trailing.
   */
  onPress?: () => void;

  /**
   * Shorthand for the leading slot.
   * Overridden by `<ListItem.Leading>` if both are provided.
   */
  leading?: ReactNode;

  /**
   * Shorthand for the trailing slot.
   * Overridden by `<ListItem.Trailing>` if both are provided.
   */
  trailing?: ReactNode;

  /**
   * Shorthand for the supporting (sub-)text slot.
   * Strings are rendered with platform-appropriate secondary styling; pass a `ReactNode` for richer content.
   * Overridden by `<ListItem.Supporting>` if both are provided.
   */
  supportingText?: string | ReactNode;

  /**
   * Identifier used to locate the component in end-to-end tests.
   */
  testID?: string;

  /**
   * Platform-specific modifier escape hatch. Pass an array of modifier configs
   * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
   * On iOS these are applied to the underlying SwiftUI `Button` and can override
   * its default `buttonStyle(.plain)`.
   */
  modifiers?: ModifierConfig[];

  /**
   * Row colors. Applied on Android via Compose's `ListItem.colors`.
   * @platform android
   */
  colors?: ListItemColors;
}
