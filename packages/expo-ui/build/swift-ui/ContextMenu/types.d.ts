import { ReactElement, ReactNode } from 'react';
import { type ButtonProps } from '../Button';
import { type CommonViewModifierProps } from '../types';
/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
    /**
     * The contents of the context menu.
     * Should include `ContextMenu.Trigger`, `ContextMenu.Items`, and optionally `ContextMenu.Preview`.
     */
    children: ReactNode;
} & CommonViewModifierProps;
/**
 * Props of the `Submenu` component.
 * @deprecated Use `ContextMenu` component as submenu instead.
 */
export type SubmenuProps = {
    /**
     * The button that will be used to expand the submenu. On Android the `text` prop of the `Button` will be used as a section title.
     */
    button: ReactElement<ButtonProps>;
    /**
     * Children of the submenu. Only `Button`, `Switch`, `Picker` and `Submenu` elements should be used.
     */
    children: ReactNode;
};
//# sourceMappingURL=types.d.ts.map