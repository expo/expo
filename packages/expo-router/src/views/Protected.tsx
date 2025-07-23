import { FunctionComponent, isValidElement, ReactElement, ReactNode } from 'react';

import { Group } from '../primitives';

export type ProtectedProps = { guard: boolean; children?: ReactNode };

export const Protected = Group as FunctionComponent<ProtectedProps>;

export function isProtectedReactElement(child: ReactNode): child is ReactElement<ProtectedProps> {
  return Boolean(
    isValidElement(child) && child.type === Group && child.props && 'guard' in (child.props as any)
  );
}
