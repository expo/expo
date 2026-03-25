import { type ReactNode } from 'react';
import { type ToolbarPlacement } from './context';
import { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
export interface StackToolbarProps {
    /**
     * Child elements to compose the toolbar. Can include Stack.Toolbar.Button,
     * Stack.Toolbar.Menu, Stack.Toolbar.View, Stack.Toolbar.Spacer, and
     * Stack.Toolbar.SearchBarSlot (bottom only) components.
     */
    children?: ReactNode;
    /**
     * The placement of the toolbar.
     *
     * - `'left'`: Renders items in the left area of the header.
     * - `'right'`: Renders items in the right area of the header.
     * - `'bottom'`: Renders items in the bottom toolbar (iOS only).
     *
     * @default 'bottom'
     */
    placement?: ToolbarPlacement;
    /**
     * When `true`, renders children as a custom component in the header area,
     * replacing the default header layout.
     *
     * Only applies to `placement="left"` and `placement="right"`.
     *
     * @default false
     */
    asChild?: boolean;
    /**
     * When `true`, disables automatic keyboard (IME) padding on the bottom toolbar.
     *
     * Only applies to `placement="bottom"` on Android.
     *
     * @default false
     * @platform android
     */
    disableImePadding?: boolean;
}
/**
 * The component used to configure the stack toolbar.
 *
 * - Use `placement="left"` to customize the left side of the header.
 * - Use `placement="right"` to customize the right side of the header.
 * - Use `placement="bottom"` (default) to show a bottom toolbar (iOS only).
 *
 * If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 *
 * > **Note:** Using `Stack.Toolbar` with `placement="left"` or `placement="right"` will
 * automatically make the header visible (`headerShown: true`), as the toolbar is rendered
 * as part of the native header.
 *
 * > **Note:** `Stack.Toolbar` with `placement="bottom"` can only be used inside **page**
 * components, not in layout components.
 *
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *         </Stack.Toolbar>
 *         <Stack.Toolbar placement="right">
 *           <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => alert('Right button pressed!')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *       </Stack.Toolbar>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="magnifyingglass" onPress={() => {}} />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @experimental
 * @platform ios
 */
export declare const StackToolbar: {
    (props: StackToolbarProps): import("react").JSX.Element;
    Button: import("react").FC<import("./StackToolbarButton").StackToolbarButtonProps>;
    Menu: import("react").FC<import("./StackToolbarMenu").StackToolbarMenuProps>;
    MenuAction: import("react").FC<import("./StackToolbarMenu").StackToolbarMenuActionProps>;
    SearchBarSlot: import("react").FC<import("./StackToolbarSearchBarSlot").StackToolbarSearchBarSlotProps>;
    Spacer: import("react").FC<import("./StackToolbarSpacer").StackToolbarSpacerProps>;
    View: import("react").FC<import("./StackToolbarView").StackToolbarViewProps>;
    Label: import("react").FC<import("./toolbar-primitives").StackToolbarLabelProps>;
    Icon: import("react").FC<import("./toolbar-primitives").StackToolbarIconProps>;
    Badge: import("react").FC<import("./toolbar-primitives").StackToolbarBadgeProps>;
};
export declare function appendStackToolbarPropsToOptions(options: NativeStackNavigationOptions, props: StackToolbarProps): NativeStackNavigationOptions;
export default StackToolbar;
//# sourceMappingURL=StackToolbarClient.d.ts.map