import { requireNativeView } from 'expo';
import React, { Ref, useState } from 'react';
import { View } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';

export type AppBarWithSearchRef = {
  setText: (newText: string) => Promise<void>;
  collapse: () => Promise<void>;
};

export type AppBarWithSearchProps = {
  /**
   * Can be used for imperatively setting text on the AppBarWithSearch search field.
   */
  ref?: Ref<AppBarWithSearchRef>;
  /**
   * The title text displayed in the app bar. Also used as the search bar placeholder if `placeholder` is not set.
   */
  title: string;
  /**
   * Placeholder text displayed in the search input field. Falls back to `title` if not set.
   */
  placeholder?: string;
  /**
   * Initial value that the search field displays when being mounted.
   */
  defaultValue?: string;
  /**
   * A callback triggered when the search query text changes.
   */
  onChangeText?: (value: string) => void;
  /**
   * A callback triggered when the user submits a search (presses enter/search on keyboard).
   */
  onSearchSubmitted?: (value: string) => void;
  /**
   * A callback triggered when the search bar expands or collapses.
   */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Navigation icon element (e.g., an `<IconButton>` with a back arrow).
   */
  navigationIcon?: React.ReactElement;
  /**
   * Trailing action icon element (e.g., an `<IconButton>` with a menu icon).
   */
  trailingIcon?: React.ReactElement;
  /**
   * Search results content shown in the full-screen expanded search overlay.
   */
  children?: React.ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeAppBarWithSearchProps = Omit<
  AppBarWithSearchProps,
  'onChangeText' | 'onSearchSubmitted' | 'onExpandedChange' | 'navigationIcon' | 'trailingIcon'
> & {
  hasNavigationIcon: boolean;
  hasTrailingIcon: boolean;
} & ViewEvent<'onValueChanged', { value: string }> &
  ViewEvent<'onSearchSubmitted', { value: string }> &
  ViewEvent<'onExpandedChange', { expanded: boolean }>;

const AppBarWithSearchNativeView: React.ComponentType<NativeAppBarWithSearchProps> =
  requireNativeView('ExpoUI', 'AppBarWithSearchView');

const Empty = <View />;

/**
 * Renders a Material 3 `AppBarWithSearch` component with an inline search bar
 * and a built-in `ExpandedFullScreenSearchBar` for full-screen search results.
 */
export function AppBarWithSearch({
  navigationIcon,
  trailingIcon,
  children,
  onChangeText,
  onSearchSubmitted,
  onExpandedChange,
  ...rest
}: AppBarWithSearchProps) {
  // Hacky but works, should be fixed in native
  // Force children to remount on collapse so the next expansion gets a fresh
  // React Native view that was never attached to a Dialog window.
  const [remountKey, setRemountKey] = useState(0);

  return (
    <AppBarWithSearchNativeView
      {...rest}
      hasNavigationIcon={navigationIcon != null}
      hasTrailingIcon={trailingIcon != null}
      onValueChanged={
        onChangeText
          ? (event) => {
              onChangeText?.(event.nativeEvent.value);
            }
          : undefined
      }
      onSearchSubmitted={
        onSearchSubmitted
          ? (event) => {
              onSearchSubmitted?.(event.nativeEvent.value);
            }
          : undefined
      }
      onExpandedChange={(event) => {
        if (!event.nativeEvent.expanded) {
          setRemountKey((k) => k + 1);
        }
        onExpandedChange?.(event.nativeEvent.expanded);
      }}>
      {navigationIcon ?? Empty}
      {trailingIcon ?? Empty}
      <React.Fragment key={remountKey}>{children}</React.Fragment>
    </AppBarWithSearchNativeView>
  );
}
