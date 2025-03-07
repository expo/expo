import { ContextMenuProps } from '.';
/**
 * The `Submenu` component is used to create a nested context menu. Submenus can be infinitely nested.
 * Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple titled sections.
 */
export declare function Submenu(): import("react").JSX.Element;
/**
 * Items visible inside the context menu. The items should be wrapped in a `React.Fragment`.
 * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
 * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
 */
export declare function Items(): import("react").JSX.Element;
export declare namespace Items {
    var tag: string;
}
/**
 * The component visible all the time that triggers the menu when tapped or long-pressed.
 */
export declare function Trigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare namespace Trigger {
    var tag: string;
}
/**
 * The component visible above the menu when it is opened.
 * @platform ios
 */
export declare function Preview(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 *
 * There are some platform-specific differences in the behavior of the context menu:
 * - On Android the expansion of the context menu is controlled by the (`expanded`)[#expanded] prop, iOS does not allow for manual control of the expansion state.
 * - On iOS the context menu can be triggered by a single press or a long press. The `activationMethod` prop allows you to choose between these two options.
 * - Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple sections. The `title` prop of the `Button`, which opens the submenu on iOS will be used as a section title.
 * - Android does not support showing a `Picker` element in the context menu.
 */
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import("./index.android").Trigger;
    var Preview: typeof import("./index.android").Preview;
    var Items: typeof import("./index.android").Items;
}
export { ContextMenu };
//# sourceMappingURL=index.android.d.ts.map