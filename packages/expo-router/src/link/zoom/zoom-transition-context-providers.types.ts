import type { PropsWithChildren } from 'react';

import type { LinkProps } from '../useLinkHooks';

export interface ZoomTransitionSourceContextProviderProps extends PropsWithChildren {
  linkProps: LinkProps;
}
