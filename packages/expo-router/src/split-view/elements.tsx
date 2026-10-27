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
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  let content: ReactNode = otherChildren.length > 0 && (
    <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>
  );
  if (content && !disableHorizontalSafeAreaInsets) {
    // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
    content = (
      <SafeAreaView key="safe-area-view" edges={{ left: true, right: true }}>
        {content}
      </SafeAreaView>
    );
  }
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
