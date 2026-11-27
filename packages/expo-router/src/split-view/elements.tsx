import type { ComponentProps, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SafeAreaView, Split, StackV5 } from '../optional-libraries/react-native-screens';

/**
 * Props for the navigation bar of a SplitView column.
 * See the [React Native Screens header configuration](https://github.com/software-mansion/react-native-screens/blob/5.0.0-beta.2/src/components/stack/header/StackHeaderConfig.types.ts).
 */
export type SplitViewHeader = ComponentProps<typeof StackV5.HeaderConfig>;

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
   * Ignored when `stackIntegration` is set.
   * @platform ios
   */
  header?: SplitViewHeader;
  /**
   * Whether the route is the only child of the content column. When the layout of the route renders an
   * `ExperimentalStack` as its root, the stack then navigates the column, and its header is the navigation bar of
   * the column. A stack that is not the root of the route is not shown.
   *
   * The column then does not apply the horizontal safe area insets.
   * @default false
   * @platform ios
   */
  stackIntegration?: boolean;
}

/**
 * Configures the content column of the SplitView. The column renders the current route.
 */
export function SplitViewContent(_props: SplitViewContentProps) {
  return null;
}

/**
 * Split.Column integrates with a Stack.Host that is its only child: the header of the stack is the navigation bar
 * of the column. So the column content is rendered in a stack with one screen.
 * @hidden
 */
export function getSplitColumnChildren(
  { children, header }: SplitViewColumnProps,
  horizontalSafeAreaInsets = false
) {
  return (
    <StackV5.Host>
      <StackV5.Screen activityMode="attached" screenKey="split-view-column">
        {getSafeAreaChildren(children, horizontalSafeAreaInsets)}
        <StackV5.HeaderConfig {...header} />
      </StackV5.Screen>
    </StackV5.Host>
  );
}

/**
 * @hidden
 */
export function getSafeAreaChildren(children: ReactNode, horizontalSafeAreaInsets = false) {
  // The SafeAreaView is always rendered, so that the content is not remounted when the insets change.
  // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
  return (
    <SafeAreaView edges={{ left: horizontalSafeAreaInsets, right: horizontalSafeAreaInsets }}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </SafeAreaView>
  );
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector({ children }: SplitViewColumnProps) {
  return <Split.Inspector>{children}</Split.Inspector>;
}
