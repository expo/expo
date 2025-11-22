'use client';

import { use } from 'react';

import type { MenuActionProps, MenuProps } from './types';
import { InternalLinkPreviewContext } from '../link/InternalLinkPreviewContext';

/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * > **Note**: You can use the alias `Link.MenuAction` for this component.
 *
 * @platform ios
 */
export function MenuAction(props: MenuActionProps) {
  if (use(InternalLinkPreviewContext)) {
    console.warn(
      '<MenuAction> is currently not supported inside Link. Use Link.MenuAction instead.'
    );
  }
  return null;
}

export function Menu(props: MenuProps) {
  if (use(InternalLinkPreviewContext)) {
    console.warn('Menu is currently not supported inside Link. Use Link.Menu instead.');
  }
  return null;
}
