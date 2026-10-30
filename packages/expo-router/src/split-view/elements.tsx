import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SafeAreaView, Split } from '../optional-libraries/react-native-screens';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{getSplitColumnChildren(props.children)}</Split.Column>;
}

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * as a direct subview. Only the other children are wrapped in a SafeAreaView with horizontal edges and a
 * SafeAreaProvider. The result is an array, because Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(
  children: ReactNode,
  disableHorizontalSafeAreaInsets?: boolean
) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  if (otherChildren.length === 0) {
    return nativeChildren;
  }
  const safeAreaProvider = (
    <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>
  );
  if (disableHorizontalSafeAreaInsets) {
    return [...nativeChildren, safeAreaProvider];
  }
  // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
  return [
    ...nativeChildren,
    <SafeAreaView key="safe-area-view" edges={{ left: true, right: true }}>
      {safeAreaProvider}
    </SafeAreaView>,
  ];
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
