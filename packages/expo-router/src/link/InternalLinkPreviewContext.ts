import { createContext } from 'react';

import type { LinkProps } from './useLinkHooks';

export type InternalLinkPreviewContextValue = {
  isVisible: boolean;
  href: LinkProps['href'];
};

export const InternalLinkPreviewContext = createContext<
  InternalLinkPreviewContextValue | undefined
>(undefined);
