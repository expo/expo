import type { ReactNode } from 'react';

/**
 * Navigation bar options for a split view column. Applied only by the `expo-ui` implementation.
 */
export interface SplitViewHeaderOptions {
  /**
   * The title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Whether the navigation bar is shown.
   * @default true
   */
  headerShown?: boolean;
  /**
   * Whether the title uses the large style. Leave undefined to let the system decide.
   */
  headerLargeTitle?: boolean;
  /**
   * Whether the back button is visible when the split view collapses to a single column.
   * @default true
   */
  headerBackVisible?: boolean;
}

/**
 * Options for routes rendered in the detail column. Set them with `SplitView.Screen` or
 * the `screenOptions` prop of `SplitView`.
 */
export type SplitViewScreenOptions = SplitViewHeaderOptions;

export interface SplitViewColumnProps extends SplitViewHeaderOptions {
  children?: ReactNode;
}

export interface SplitViewInspectorProps {
  children?: ReactNode;
}

/**
 * A column shown before the detail column. `SplitView` reads its props and renders the column
 * with the selected implementation, so it renders nothing on its own.
 */
export function SplitViewColumn(_props: SplitViewColumnProps) {
  return null;
}

/**
 * A column shown after the detail column. Supported only by the `rns` implementation.
 *
 * @platform iOS 26+
 */
export function SplitViewInspector(_props: SplitViewInspectorProps) {
  return null;
}
