import { ReactElement, ReactNode } from 'react';

import { type ButtonProps } from '../Button';
import { type CommonViewModifierProps } from '../types';

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
   */
  activationMethod?: ActivationMethod;

  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a pressable element, which triggers opening of the context menu.
   */
  children: ReactNode;
} & CommonViewModifierProps;

/**
 * Props of the `Submenu` component.
 * @deprecated Use `ContextMenu` component as Submenu instead.
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
