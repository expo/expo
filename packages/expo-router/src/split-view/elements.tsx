import { Children, isValidElement, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Split } from '../optional-libraries/react-native-screens';

/**
 * Navigation bar options for a split view column. Applied only by the `expo-ui` implementation.
 */
export interface SplitViewHeaderOptions {
  /**
   * The title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Whether the title uses the large style. Leave undefined to let the system decide.
   */
  headerLargeTitle?: boolean;
}

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

function isSplitColumnNativeChild(child: ReactNode) {
  return isValidElement(child) && (child.type === Split.Stack || child.type === Split.HeaderConfig);
}

export function getSplitColumnChildren(children: ReactNode) {
  const childrenArray = Children.toArray(children);
  const nativeChildren = childrenArray.filter(isSplitColumnNativeChild);
  const otherChildren = childrenArray.filter((child) => !isSplitColumnNativeChild(child));
  return otherChildren.length
    ? [
        ...nativeChildren,
        <SafeAreaProvider key="safe-area-provider">{otherChildren}</SafeAreaProvider>,
      ]
    : nativeChildren;
}

/**
 * A column shown after the detail column. Supported only by the `rns` implementation.
 *
 * @platform iOS 26+
 */
export function SplitViewInspector(_props: SplitViewInspectorProps) {
  return null;
}
