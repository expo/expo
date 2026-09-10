import { type CommonViewModifierProps } from '../types';
export interface ToolbarProps extends CommonViewModifierProps {
    /**
     * The view the toolbar belongs to, together with the `Toolbar.Content` that fills it.
     */
    children: React.ReactNode;
}
export interface ToolbarContentProps {
    /**
     * The items to place in the toolbar.
     */
    children: React.ReactNode;
}
/**
 * The items placed in the toolbar of the view `Toolbar` wraps.
 */
declare function ToolbarContent(props: ToolbarContentProps): import("react/jsx-runtime").JSX.Element;
/**
 * Adds a toolbar to the view it wraps, matching SwiftUI's `toolbar(content:)`.
 *
 * @example
 * ```tsx
 * <NavigationStack>
 *   <Toolbar>
 *     <Text>Bird description</Text>
 *     <Toolbar.Content>
 *       <Button role="close" onPress={() => setIsPresented(false)} />
 *     </Toolbar.Content>
 *   </Toolbar>
 * </NavigationStack>
 * ```
 *
 * @platform ios
 */
declare function ToolbarComponent(props: ToolbarProps): import("react/jsx-runtime").JSX.Element;
declare const Toolbar: typeof ToolbarComponent & {
    Content: typeof ToolbarContent;
};
export { Toolbar };
//# sourceMappingURL=index.d.ts.map