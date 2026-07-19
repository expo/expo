import { createContext, useContext } from 'react';

import { PageMetadata } from '~/types/common';

export const PageMetadataContext = createContext<PageMetadata>({});

export function usePageMetadata() {
  return useContext(PageMetadataContext);
}
