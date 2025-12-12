import { ToolbarHost, ToolbarMenu, ToolbarMenuAction, ToolbarButton, ToolbarSpacer, ToolbarView } from './elements';
/**
 * A component that provides a [bottom toolbar](https://developer.apple.com/design/human-interface-guidelines/toolbars).
 *
 * @example
 * ```tsx
 * import { Toolbar } from "expo-router";
 *
 * export default function MyScreen() {
 *   return (
 *     <>
 *       <YourScreenContent />
 *       <Toolbar>
 *        <Toolbar.Button sf="magnifyingglass" />
 *       </Toolbar>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const Toolbar: ((props: import("./elements").ToolbarProps) => import("react").JSX.Element) & {
    Menu: import("react").FC<import("..").LinkMenuProps>;
    MenuAction: typeof import("..").LinkMenuAction;
    Button: ({ children, sf, onPress, ...rest }: import("./elements").ToolbarButtonProps) => import("react").JSX.Element;
    Spacer: ({ width, ...rest }: import("./elements").ToolbarSpacerProps) => import("react").JSX.Element;
    View: ({ children, style, ...rest }: import("./elements").ToolbarViewProps) => import("react").JSX.Element;
};
export { ToolbarMenu, ToolbarMenuAction, ToolbarButton, ToolbarSpacer, ToolbarView, ToolbarHost };
export type { ToolbarProps, ToolbarMenuProps, ToolbarMenuActionProps, ToolbarButtonProps, ToolbarSpacerProps, ToolbarViewProps as ToolbarCustomViewProps, } from './elements';
//# sourceMappingURL=index.d.ts.map