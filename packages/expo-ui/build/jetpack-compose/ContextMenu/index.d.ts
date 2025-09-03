import { ReactElement, ReactNode } from 'react';
import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { SubmenuProps } from './Submenu';
import { ExpoModifier } from '../../types';
import { ButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';
type SubmenuElement = ReactElement<ButtonProps> | ReactElement<SwitchProps> | ReactElement<PickerProps> | ReactElement<SubmenuProps>;
export type ContextMenuContentProps = {
    children: SubmenuElement | SubmenuElement[];
};
/**
 * @hidden
 */
export type EventHandlers = Record<string, Record<string, (event: NativeSyntheticEvent<any>) => void>>;
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
     * Optional styles to apply to the `ContextMenu`.
     */
    style?: StyleProp<ViewStyle>;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
export declare function Items(props: ContextMenuContentProps): import("react").JSX.Element;
export declare namespace Items {
    var tag: string;
}
export declare function Trigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare namespace Trigger {
    var tag: string;
}
export declare function Preview(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import(".").Trigger;
    var Preview: typeof import(".").Preview;
    var Items: typeof import(".").Items;
}
export { ContextMenu };
export { Submenu } from './Submenu';
//# sourceMappingURL=index.d.ts.map