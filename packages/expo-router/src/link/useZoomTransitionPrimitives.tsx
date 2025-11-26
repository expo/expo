'use client';

import React, { useMemo } from 'react';

import { LinkProps } from './useLinkHooks';

export function useZoomTransitionPrimitives({ href }: LinkProps) {
  const ZoomTransitionWrapper = useMemo(() => {
    return (props: { children: React.ReactNode }) => props.children;
  }, []);
  return { ZoomTransitionWrapper, href };
}
