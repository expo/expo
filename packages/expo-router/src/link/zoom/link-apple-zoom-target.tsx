import { Children, use, type ReactNode } from 'react';

import { ZoomTransitionTargetContext } from './zoom-transition-context';
import { LinkZoomTransitionAlignmentRectDetector } from '../preview/native';

/**
 * Defines the target for an Apple zoom transition.
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 *
 * export default function Screen() {
 *  return (
 *   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
 *    <Link.AppleZoomTarget>
 *      <Image source={require('../assets/image.png')} style={{ width: 200, height: 200 }} />
 *    </Link.AppleZoomTarget>
 *   </View>
 *  );
 * }
 * ```
 *
 * @platform ios 18+
 */
export function LinkAppleZoomTarget({ children }: { children?: ReactNode }) {
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
