import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SafeAreaView, Split } from '../optional-libraries/react-native-screens';
import { SplitViewColumnHeader } from './header';

export interface SplitViewHeader {
  /**
   * Title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Whether the navigation bar of the column shows a large title.
   * @default false
   */
  largeTitle?: boolean;
}

export interface SplitViewColumnProps {
  children?: React.ReactNode;
  /**
   * Navigation bar of the column.
   * @platform ios
   */
  header?: SplitViewHeader;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{getSplitColumnChildren(props)}</Split.Column>;
}

export interface SplitViewContentProps {
  /**
   * Navigation bar of the content column, which renders the current route.
   * @platform ios
   */
  header?: SplitViewHeader;
}

/**
 * Configures the content column of the SplitView. The column renders the current route.
 */
export function SplitViewContent(_props: SplitViewContentProps) {
  return null;
}

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * and the header view as direct subviews. Only the other children are wrapped in a SafeAreaView and a
 * SafeAreaProvider. The result is an array, because Split.Column does not look into fragments.
 * @hidden
 */
export function getSplitColumnChildren(
  { children, header }: SplitViewColumnProps,
  horizontalSafeAreaInsets = false
) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  // The SafeAreaView is always rendered, so that the content is not remounted when the insets change.
  // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
  const content = otherChildren.length > 0 && (
    <SafeAreaView
      key="safe-area-view"
      edges={{ left: horizontalSafeAreaInsets, right: horizontalSafeAreaInsets }}>
      <SafeAreaProvider>{otherChildren}</SafeAreaProvider>
    </SafeAreaView>
  );
  return [
    ...nativeChildren,
    content,
    header && <SplitViewColumnHeader key="header" header={header} />,
  ];
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector({ children, header }: SplitViewColumnProps) {
  return (
    <Split.Inspector>
      {children}
      {header && <SplitViewColumnHeader header={header} />}
    </Split.Inspector>
  );
}
