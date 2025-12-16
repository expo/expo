import { type ReactNode } from 'react';

import { type CommonViewModifierProps } from '../types';

/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
  /**
   * The contents of the submenu are used as an anchor for the context menu.
   * The children will be wrapped in a `<Pressable>` component, which triggers opening of the context menu.
   */
  children: ReactNode;
} & CommonViewModifierProps;
