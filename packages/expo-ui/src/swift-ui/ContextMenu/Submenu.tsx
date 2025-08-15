import { type ReactElement, type ReactNode } from 'react';

import { type ButtonProps } from '../Button';

/**
 * Props of the `Submenu` component.
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

/**
 * The `Submenu` component is used to create a nested context menu. Submenus can be infinitely nested.
 * Android does not support nesting in the context menu. All the submenus will be flat-mapped into a single level with multiple titled sections.
 */
export function Submenu(props: SubmenuProps) {
  return <></>;
}
