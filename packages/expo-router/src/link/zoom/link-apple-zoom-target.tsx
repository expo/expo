import { Children, use, type PropsWithChildren } from 'react';

import { ZoomTransitionTargetContext } from './zoom-transition-context';
import { LinkZoomTransitionAlignmentRectDetector } from '../preview/native';

export function LinkAppleZoomTarget({ children }: PropsWithChildren) {
  if (Children.count(children) > 1) {
    console.warn(
      '[expo-router] Link.AppleZoomTarget only accepts a single child component. Please wrap multiple children in a View or another container component.'
    );
    return null;
  }
  const { identifier } = use(ZoomTransitionTargetContext);
  if (!identifier) {
    return children;
  }
  return (
    <LinkZoomTransitionAlignmentRectDetector identifier={identifier}>
      {children}
    </LinkZoomTransitionAlignmentRectDetector>
  );
}
