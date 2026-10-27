import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

import { SafeAreaView, Split } from '../optional-libraries/react-native-screens';
import { SplitViewColumnHeader } from './header';

export interface SplitViewToolbarItem {
  /**
   * Title of the button. When `icon` is set, it is used as the accessibility label.
   */
  title: string;
  /**
   * SF Symbol shown instead of the title.
   */
  icon?: SFSymbol;
  /**
   * Called when the button is pressed.
   */
  onPress: () => void;
}

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
  /**
   * Buttons shown on the leading side of the navigation bar.
   */
  leftToolbar?: SplitViewToolbarItem[];
  /**
   * Buttons shown on the trailing side of the navigation bar.
   */
  rightToolbar?: SplitViewToolbarItem[];
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

export interface SplitViewStackProps {
  /**
   * Navigation bar of the content column, which renders the current route.
   * @platform ios
   */
  header?: SplitViewHeader;
}

/**
 * Configures the content column of the SplitView. The column renders the current route.
 */
export function SplitViewStack(_props: SplitViewStackProps) {
  return null;
}

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

/**
 * Split.Column must see a Split.Stack as its direct child, and the native split screen must see its header config
 * and the header view as direct subviews. Only the other children are wrapped in a SafeAreaView with horizontal
 * edges and a SafeAreaProvider. The result is an array, because Split.Column does not look into fragments.
 */
export function getSplitColumnChildren(
  { children, header }: SplitViewColumnProps,
  disableHorizontalSafeAreaInsets?: boolean
) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  if (header) {
    nativeChildren.unshift(<SplitViewColumnHeader key="header" header={header} />);
  }
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
export function SplitViewInspector({ children, header }: SplitViewColumnProps) {
  return (
    <Split.Inspector>
      {header && <SplitViewColumnHeader header={header} />}
      {children}
    </Split.Inspector>
  );
}
