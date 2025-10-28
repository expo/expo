import { ReactElement, ReactNode } from 'react';

import { ButtonProps } from '../Button';

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

export function Submenu(props: SubmenuProps) {
  return <></>;
}
