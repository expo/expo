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
export interface NativeToolbarSearchBarSlotProps {
    hidesSharedBackground?: boolean;
    hidden?: boolean;
    separateBackground?: boolean;
}
//# sourceMappingURL=types.d.ts.map