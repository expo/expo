'use client';

import { createContext, use } from 'react';

import type { UnknownOutputParams } from '../../types';

export interface PreviewRouteContextType {
  params: UnknownOutputParams;
  pathname: string;
  segments: string[];
}

export const PreviewRouteContext = createContext<PreviewRouteContextType | undefined>(undefined);

type UsePreviewInfo = { isPreview: boolean } & Partial<PreviewRouteContextType>;

/**
 * Returns information about the current route if it is displayed in preview mode.
 */
export function usePreviewInfo(): UsePreviewInfo {
  const paramsContext = use(PreviewRouteContext);
  return {
    isPreview: !!paramsContext,
    ...paramsContext,
  };
}

/**
 * Hook to determine if the current route is rendered inside a preview.
 *
 *  @returns {boolean} - True if the current route is rendered inside a preview, false otherwise.
 */
export function useIsPreview(): boolean {
  const { isPreview } = usePreviewInfo();
  return isPreview;
}
