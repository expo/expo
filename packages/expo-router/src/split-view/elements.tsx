import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Split } from '../optional-libraries/react-native-screens';
import { SplitViewColumnOptionsView } from './native';
import type { SplitViewColumnOptions } from './native.types';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
  /**
   * Options for the navigation bar of the column.
   * @platform ios
   */
  options?: SplitViewColumnOptions;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{getSplitColumnChildren(props.children, props.options)}</Split.Column>;
}

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * as a direct subview. Only the other children are wrapped in a SafeAreaProvider. The result is an array, because
 * Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(children: ReactNode, options?: SplitViewColumnOptions) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  if (options) {
    nativeChildren.unshift(<SplitViewColumnOptionsView key="options" {...options} />);
  }
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  if (otherChildren.length === 0) {
    return nativeChildren;
  }
  return [
    ...nativeChildren,
    <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>,
  ];
}

export interface SplitViewInspectorProps {
  children?: React.ReactNode;
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewInspectorProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
