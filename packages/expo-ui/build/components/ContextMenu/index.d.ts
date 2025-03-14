import { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { MenuElement } from './utils';
import { ButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';
type SubmenuElement = ReactElement<ButtonProps> | ReactElement<SwitchProps> | ReactElement<PickerProps> | ReactElement<SubmenuProps>;
type ContentChildren = SubmenuElement | SubmenuElement[];
/**
 * @hidden
 */
export type ContextMenuContentProps = {
    children: ContentChildren;
};
/**
 * @hidden
 */
export type EventHandlers = {
    [key: string]: {
        [key: string]: (event: NativeSyntheticEvent<any>) => void;
    };
};
/**
 * @hidden
 */
export type ContextMenuElementBase = {
    contextMenuElementID: string;
};
/**
 * Activation method of the context menu.
 * - `singlePress`: The context menu is opened with a single tap. Does not isolate the content.
 * - `longPress`: The context menu is opened with a long press. On iOS additionally Highlights the content by blurring the background.
 */
export type ActivationMethod = 'singlePress' | 'longPress';
/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
    /**
     * Determines how the context menu will be activated.
     *
     * @platform ios
     */
    activationMethod?: ActivationMethod;
    /**
     * The contents of the submenu are used as an anchor for the context menu.
     * The children will be wrapped in a pressable element, which triggers opening of the context menu.
     */
    children: ReactNode;
    /**
     * The color of the container holding the context menu items.
     *
     * @platform android
     */
    color?: string;
    /**
     * Optional styles to apply to the `ContextMenu`
     */
    style?: StyleProp<ViewStyle>;
};
/**
 * Props of the `Submenu` component.
 */
export type SubmenuProps = {
    /**
     * The button that will be used to expand the submenu. On Android the `text` prop of the `Button` will be used as a section title.
     */
    button: React.ReactElement<ButtonProps>;
    /**
     * Children of the submenu. Only `Button`, `Switch`, `Picker` and `Submenu` elements should be used.
     */
    children: React.ReactNode;
};
/**
 * @hidden
 */
export type NativeMenuProps = ContextMenuProps & {
    elements: MenuElement[];
    onContextMenuButtonPressed: (event: NativeSyntheticEvent<{
        contextMenuElementID: string;
    }>) => void;
    onContextMenuSwitchValueChanged: (event: NativeSyntheticEvent<{
        contextMenuElementID: string;
        value: boolean;
    }>) => void;
    onContextMenuPickerOptionSelected: (event: NativeSyntheticEvent<{
        index: number;
        label: string;
        contextMenuElementID: string;
    }>) => void;
};
/**
 * The `Submenu` component is used to create a nested context menu. Submenus can be infinitely nested.
 * Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple titled sections.
 */
export declare function Submenu(props: SubmenuProps): import("react").JSX.Element;
/**
 * Items visible inside the context menu. Pass input components as immidiate children of the tag.
 * `Button`, `Switch` and `Submenu` components are supported on both Android and iOS.
 * The `Picker` component is supported only on iOS. Remember to use components from the `@expo/ui` library.
 */
export declare function Items(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare namespace Items {
    var tag: string;
}
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
    var Trigger: typeof import(".").Trigger;
    var Preview: typeof import(".").Preview;
    var Items: typeof import(".").Items;
}
export { ContextMenu };
//# sourceMappingURL=index.d.ts.map