'use client';
import { NativeToolbarSearchBarSlot } from './bottom-toolbar-native-elements';
import { useToolbarPlacement } from './context';

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
   * Whether this search bar slot shares background with adjacent items.
   *
   * @platform iOS 26+
   */
  sharesBackground?: boolean;
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.SearchBarSlot is only available in Bottom placement. It will not render in Left or Right placement.'
      );
    }
    return null;
  }

  return <NativeToolbarSearchBarSlot {...props} />;
};
