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
export declare const StackToolbarSearchBarSlot: React.FC<StackToolbarSearchBarSlotProps>;
//# sourceMappingURL=StackToolbarSearchBarSlot.d.ts.map