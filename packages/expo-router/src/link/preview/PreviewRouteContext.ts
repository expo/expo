import { createContext, use } from 'react';

import type { UnknownOutputParams } from '../../types';

export interface PreviewRouteContextType {
  params: UnknownOutputParams;
  pathname: string;
  segments: string[];
}

export const PreviewRouteContext = createContext<PreviewRouteContextType | undefined>(undefined);

type UsePreviewInfo = { isPreview: boolean } & Partial<PreviewRouteContextType>;

export function usePreviewInfo(): UsePreviewInfo {
  const paramsContext = use(PreviewRouteContext);
  return {
    isPreview: !!paramsContext,
    ...paramsContext,
  };
}
