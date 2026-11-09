import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SafeAreaView, Split } from '../optional-libraries/react-native-screens';

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * as a direct subview. Only the other children are wrapped in a SafeAreaView and a SafeAreaProvider. The result is an
 * array, because Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(children: ReactNode, horizontalSafeAreaInsets: boolean) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  if (otherChildren.length === 0) {
    return nativeChildren;
  }
  // The SafeAreaView is always rendered, so that the content is not remounted when the insets change.
  // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
  return [
    ...nativeChildren,
    <SafeAreaView
      key="safe-area-view"
      edges={{ left: horizontalSafeAreaInsets, right: horizontalSafeAreaInsets }}>
      <SafeAreaProvider>{otherChildren}</SafeAreaProvider>
    </SafeAreaView>,
  ];
}
