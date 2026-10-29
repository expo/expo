import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Split } from '../optional-libraries/react-native-screens';

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
 * as a direct subview. Only the other children are wrapped in a SafeAreaProvider. The result is an array, because
 * Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(children: ReactNode) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  if (otherChildren.length === 0) {
    return nativeChildren;
  }
  return [
    ...nativeChildren,
    <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>,
  ];
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
