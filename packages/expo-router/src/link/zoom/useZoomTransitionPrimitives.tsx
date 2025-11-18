'use client';

import { LinkProps } from '../useLinkHooks';
import type { ZoomTransitionSourceContextValueType } from './zoom-transition-context';

export function useZoomTransitionPrimitives({ href }: LinkProps) {
  const zoomTransitionSourceContextValue: ZoomTransitionSourceContextValueType = undefined;
  return { zoomTransitionSourceContextValue, href };
}
