'use client';
import { useId } from 'react';
import { Platform } from 'react-native';

import { useToolbarPlacement } from './context';
import { RouterToolbarItem } from '../../../toolbar/native';

export interface StackToolbarSearchBarSlotProps {
  /**
   * Whether the search bar slot should be hidden.
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
   * Whether this search bar slot has a separate background from adjacent items. When this prop is `true`, the search bar will always render as `integratedButton`.
   *
   * In order to render the search bar with a separate background, ensure that adjacent toolbar items have `separateBackground` set to `true` or use `Stack.Toolbar.Spacer` to create spacing.
   *
   * @example
   * ```tsx
   * <Stack.SearchBar onChangeText={()=>{}} />
   * <Stack.Toolbar placement="bottom">
   *   <Stack.Toolbar.SearchBarSlot />
   *   <Stack.Toolbar.Spacer />
   *   <Stack.Toolbar.Button icon="square.and.pencil" />
   * </Stack.Toolbar>
   * ```
   *
   * @platform iOS 26+
   */
  separateBackground?: boolean;
}

/**
 * A search bar slot for the bottom toolbar. This reserves space for the search bar
 * in the toolbar and allows positioning it among other toolbar items.
 *
 * This component is only available in bottom placement (`<Stack.Toolbar>` or `<Stack.Toolbar placement="bottom">`).
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Button icon="folder" />
 *         <Stack.Toolbar.SearchBarSlot />
 *         <Stack.Toolbar.Button icon="ellipsis.circle" />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform iOS 26+
 */
export const StackToolbarSearchBarSlot: React.FC<StackToolbarSearchBarSlotProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.SearchBarSlot must be used inside a Stack.Toolbar');
  }

  return <NativeToolbarSearchBarSlot {...props} />;
};

// #region NativeToolbarSearchBarSlot

interface NativeToolbarSearchBarSlotProps {
  hidesSharedBackground?: boolean;
  hidden?: boolean;
  separateBackground?: boolean;
}

/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps> = ({
  hidesSharedBackground,
  hidden,
  separateBackground,
}) => {
  const id = useId();
  if (process.env.EXPO_OS !== 'ios' || parseInt(String(Platform.Version).split('.')[0], 10) < 26) {
    return null;
  }
  if (hidden) {
    return null;
  }
  return (
    <RouterToolbarItem
      hidesSharedBackground={hidesSharedBackground}
      identifier={id}
      sharesBackground={!separateBackground}
      type="searchBar"
    />
  );
};

// #endregion
