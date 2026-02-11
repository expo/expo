import { type PropsWithChildren } from 'react';

import type { LinkProps } from '../useLinkHooks';

export interface ZoomTransitionTargetContextProviderProps extends PropsWithChildren {
  route: unknown;
}

export interface ZoomTransitionSourceContextProviderProps extends PropsWithChildren {
  linkProps: LinkProps;
}
