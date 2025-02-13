import { ReactNode } from 'react';
import { ContextMenuElementBase, EventHandlers } from './index';
import { NativeButtonProps } from '../Button';
import { PickerProps } from '../Picker';
import { SwitchProps } from '../Switch';
type ButtonMenuElement = {
    button: NativeButtonProps;
} & ContextMenuElementBase;
type SwitchMenuElement = {
    switch: SwitchProps;
} & ContextMenuElementBase;
type PickerMenuElement = {
    picker: PickerProps;
} & ContextMenuElementBase;
type SubmenuElement = {
    submenu: {
        elements: MenuElement[];
        button: NativeButtonProps;
    };
} & ContextMenuElementBase;
export type MenuElement = ButtonMenuElement | SwitchMenuElement | PickerMenuElement | SubmenuElement;
export declare function transformChildrenToElementArray(children: ReactNode, eventHandlersMap: EventHandlers): MenuElement[];
export {};
//# sourceMappingURL=utils.d.ts.map