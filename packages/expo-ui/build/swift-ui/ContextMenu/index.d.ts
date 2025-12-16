import { type ContextMenuProps } from './types';
/**
 * Items visible inside the context menu. It could be `Section`, `Divider`, `Button`, `Switch`, `Picker` or even `ContextMenu` itself for nested menus. Remember to use components from the `@expo/ui/swift-ui` library.
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
 * `ContextMenu` allows you to create a context menu, which can be used to provide additional options to the user.
 */
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import(".").Trigger;
    var Preview: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
    var Items: typeof import(".").Items;
}
export { ContextMenu };
export { type ContextMenuProps } from './types';
//# sourceMappingURL=index.d.ts.map