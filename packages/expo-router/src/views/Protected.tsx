import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';

import { Group } from '../primitives';
import type { Href } from '../types';

export type ProtectedProps = {
  guard: boolean;
  /**
   * Where to redirect when `guard` is `false`. Same `Href` type as `Link` and `Redirect`.
   * Defaults to the containing navigator's anchor (its `unstable_settings.anchor`), or `/`.
   */
  redirectTo?: Href;
  children?: ReactNode;
};

export const Protected = Group as FunctionComponent<ProtectedProps>;

export function isProtectedReactElement(child: ReactNode): child is ReactElement<ProtectedProps> {
  return Boolean(
    isValidElement(child) && child.type === Group && child.props && 'guard' in (child.props as any)
  );
}
