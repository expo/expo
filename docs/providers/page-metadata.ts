import { createContext, useContext } from 'react';

import { PageMetadata } from '~/types/common';

export const PageMetadataContext = createContext<PageMetadata>({ title: '' });

export function usePageMetadata() {
  return useContext(PageMetadataContext);
}
