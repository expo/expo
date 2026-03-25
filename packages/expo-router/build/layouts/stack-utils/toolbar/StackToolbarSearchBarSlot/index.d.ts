import type { StackToolbarSearchBarSlotProps } from './types';
export type { StackToolbarSearchBarSlotProps, NativeToolbarSearchBarSlotProps } from './types';
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
export declare const StackToolbarSearchBarSlot: React.FC<StackToolbarSearchBarSlotProps>;
//# sourceMappingURL=index.d.ts.map