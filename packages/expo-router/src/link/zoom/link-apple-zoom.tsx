'use client';

import { Children, use, useEffect, type PropsWithChildren } from 'react';

import { isZoomTransitionEnabled } from './ZoomTransitionEnabler.ios';
import { ZoomTransitionSourceContext } from './zoom-transition-context';
import { Slot } from '../../ui/Slot';
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

/**
 * When this component is used inside a Link, [zoom transition](https://developer.apple.com/documentation/uikit/enhancing-your-app-with-fluid-transitions?language=objc)
 * will be used when navigating to the link's href.
 *
 * @platform ios 18+
 */
export function LinkAppleZoom(props: LinkAppleZoomProps) {
  if (!isZoomTransitionEnabled()) {
    return <Slot {...props} />;
  }
  return <LinkAppleZoomImpl {...props} />;
}

type LinkAppleZoomImplProps = LinkAppleZoomProps & {
  onPress?: () => void;
};

function LinkAppleZoomImpl({ children, alignmentRect, ...rest }: LinkAppleZoomImplProps) {
  const value = use(ZoomTransitionSourceContext);
  if (!value) {
    throw new Error('[expo-router] Link.ZoomTransitionSource must be used within a Link');
  }
  const { identifier, addSource, removeSource } = value;

  useEffect(() => {
    addSource();
    return removeSource;
  }, [addSource, removeSource]);

  if (Children.count(children) > 1) {
    console.warn(
      '[expo-router] Link.ZoomTransitionSource only accepts a single child component. Please wrap multiple children in a View or another container component.'
    );
    return null;
  }

  return (
    <LinkZoomTransitionSource identifier={identifier} alignment={alignmentRect}>
      <Slot {...rest}>{children}</Slot>
    </LinkZoomTransitionSource>
  );
}
