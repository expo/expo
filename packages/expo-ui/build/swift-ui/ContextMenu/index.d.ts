import { type SubmenuProps, type ContextMenuProps } from './types';
export { type ActivationMethod, type ContextMenuProps } from './types';
/**
 * Items visible inside the context menu. Pass input components as immidiate children of the tag.
 * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
 * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
 */
export declare function Items(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * The component visible all the time that triggers the menu when tapped or long-pressed.
 */
export declare function Trigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * The component visible above the menu when it is opened.
 * @platform ios
 */
export declare function Preview(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * `<ContextMenu>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
/**
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 *
 * There are some platform-specific differences in the behavior of the context menu:
 * - On Android, the expansion of the context menu is controlled by the `expanded` prop. iOS, does not allow for manual control of the expansion state.
 * - On iOS, the context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
 * - Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple sections. The `title` prop of the `Button`, which opens the submenu on iOS will be used as a section title.
 * - Android does not support showing a `Picker` element in the context menu.
 */
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import(".").Trigger;
    var Preview: typeof import(".").Preview;
    var Items: typeof import(".").Items;
}
/**
 * @deprecated Use `ContextMenu` component as Submenu instead.
 */
declare const Submenu: (props: SubmenuProps) => import("react").JSX.Element;
export { ContextMenu, Submenu };
//# sourceMappingURL=index.d.ts.map