import { type SubmenuProps, type ContextMenuProps } from './types';
export { type ActivationMethod, type ContextMenuProps } from './types';
/**
 * Items visible inside the context menu.
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
 * - The context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
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