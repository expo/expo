import { type CommonViewModifierProps } from '../types';
export type NavigationSplitViewVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';
/**
 * The column shown when the split view collapses into a single column.
 */
export type NavigationSplitViewColumn = 'sidebar' | 'content' | 'detail';
export interface NavigationSplitViewProps extends CommonViewModifierProps {
    /**
     * The columns of the split view. Provide `NavigationSplitView.Sidebar` and
     * `NavigationSplitView.Detail`, and add `NavigationSplitView.Content` for a
     * three-column layout.
     */
    children: React.ReactNode;
    /**
     * The columns to show. Setting it makes the value controlled: pass the value from
     * `onColumnVisibilityChange` back in, otherwise dragging the divider has no effect.
     * Leave it unset to let the split view manage its own columns.
     * @default 'automatic'
     */
    columnVisibility?: NavigationSplitViewVisibility;
    /**
     * Called when the visible columns change, including when the user drags the sidebar.
     */
    onColumnVisibilityChange?: (visibility: NavigationSplitViewVisibility) => void;
    /**
     * The column to show when the split view collapses to a single column, for example
     * in a narrow window. Setting it makes the value controlled in the same way as
     * `columnVisibility`.
     * @default 'sidebar'
     * @platform ios 17.0+
     */
    preferredCompactColumn?: NavigationSplitViewColumn;
    /**
     * Called when the collapsed column changes.
     * @platform ios 17.0+
     */
    onPreferredCompactColumnChange?: (column: NavigationSplitViewColumn) => void;
}
declare function NavigationSplitViewSidebar(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
declare function NavigationSplitViewContent(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
declare function NavigationSplitViewDetail(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * NavigationSplitView uses the native [NavigationSplitView](https://developer.apple.com/documentation/swiftui/navigationsplitview) view.
 *
 * It presents a collection, a selection and a detail in one hierarchy: side by side
 * when there is room, and stacked when there is not.
 * @example
 * ```tsx
 * <Host style={{ flex: 1 }}>
 *   <NavigationSplitView>
 *     <NavigationSplitView.Sidebar>
 *       <List>{items}</List>
 *     </NavigationSplitView.Sidebar>
 *     <NavigationSplitView.Detail>
 *       <ItemDetail item={selectedItem} />
 *     </NavigationSplitView.Detail>
 *   </NavigationSplitView>
 * </Host>
 * ```
 * @platform ios 16.0+
 * @platform tvos 16.0+
 */
export declare function NavigationSplitView(props: NavigationSplitViewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace NavigationSplitView {
    var Sidebar: typeof NavigationSplitViewSidebar;
    var Content: typeof NavigationSplitViewContent;
    var Detail: typeof NavigationSplitViewDetail;
}
export {};
//# sourceMappingURL=index.d.ts.map