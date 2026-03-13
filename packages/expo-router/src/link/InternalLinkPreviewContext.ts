import { createContext, type RefObject } from 'react';

import type { LinkProps } from './useLinkHooks';

export type InternalLinkPreviewContextValue = {
  isVisible: boolean;
  href: LinkProps['href'];
  blockPressRef: RefObject<boolean>;
};

export const InternalLinkPreviewContext = createContext<
  InternalLinkPreviewContextValue | undefined
>(undefined);
