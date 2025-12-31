import { ToolbarMenu, ToolbarMenuAction, ToolbarButton, ToolbarSpacer, ToolbarSearchBarPlacement, ToolbarView } from './elements';
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
 *         <Toolbar.Spacer />
 *         <Toolbar.Button icon="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *         <Toolbar.View>
 *           <TextInput style={{ width: 200 }} placeholder="Search" />
 *         </Toolbar.View>
 *         <Toolbar.Menu icon="ellipsis">
 *           <Toolbar.MenuAction icon="mail" title="Send email" onPress={() => {}} />
 *           <Toolbar.MenuAction icon="trash" title="Delete" destructive onPress={() => {}} />
 *         </Toolbar.Menu>
 *         <Toolbar.Spacer />
 *       </Toolbar>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const Toolbar: ((props: import("./elements").ToolbarProps) => import("react").JSX.Element) & {
    Menu: import("react").FC<import("./elements").ToolbarMenuProps>;
    MenuAction: typeof import("..").LinkMenuAction;
    Button: (props: import("./elements").ToolbarButtonProps) => import("react").JSX.Element;
    Spacer: (props: import("./elements").ToolbarSpacerProps) => import("react").JSX.Element;
    SearchBarPlacement: ({ hidesSharedBackground, hidden, sharesBackground, }: import("./elements").ToolbarSearchBarPlacementProps) => import("react").JSX.Element | null;
    View: ({ children, hidden, hidesSharedBackground, separateBackground, }: import("./elements").ToolbarViewProps) => import("react").JSX.Element;
};
export { ToolbarMenu, ToolbarMenuAction, ToolbarButton, ToolbarSpacer, ToolbarSearchBarPlacement, ToolbarView, };
export type { ToolbarProps, ToolbarMenuProps, ToolbarMenuActionProps, ToolbarButtonProps, ToolbarSpacerProps, ToolbarSearchBarPlacementProps, ToolbarViewProps as ToolbarCustomViewProps, } from './elements';
//# sourceMappingURL=index.d.ts.map