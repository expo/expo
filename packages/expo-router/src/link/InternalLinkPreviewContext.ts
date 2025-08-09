import { createContext } from 'react';

import type { LinkProps } from './useLinkHooks';

export const InternalLinkPreviewContext = createContext<
  { isVisible: boolean; href: LinkProps['href'] } | undefined
>(undefined);
