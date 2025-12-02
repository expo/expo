'use client';

import { Children, use, type PropsWithChildren } from 'react';

import { isZoomTransitionEnabled } from '../ZoomTransitionEnabler.ios';
import { ZoomTransitionSourceContext } from './zoom-transition-context';
import { LinkZoomTransitionSource } from '../preview/native';

interface LinkAppleZoomProps extends PropsWithChildren {
  /**
   * Defines the rectangle used for the zoom transition's alignment. This rectangle is specified in the zoomed screen's coordinate space.
   *
   * @platform ios 18+
   */
  alignmentRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function LinkAppleZoom({ children, alignmentRect }: LinkAppleZoomProps) {
  if (!isZoomTransitionEnabled()) {
    return children;
  }
  const value = use(ZoomTransitionSourceContext);
  if (!value) {
    throw new Error(
      '[expo-router] Link.ZoomTransitionSource must be used within a Link component with unstable_transition="zoom" and unstable_customTransitionSource={true}.'
    );
  }
  const { identifier } = value;
  console.log('Link.ZoomTransitionSourceWrapper rendering with identifier:', identifier);
  if (Children.count(children) > 1) {
    console.warn(
      '[expo-router] Link.ZoomTransitionSource only accepts a single child component. Please wrap multiple children in a View or another container component.'
    );
    return null;
  }

  return (
    <LinkZoomTransitionSource identifier={identifier} alignment={alignmentRect}>
      {children}
    </LinkZoomTransitionSource>
  );
}
