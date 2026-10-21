import { Children, isValidElement, type ComponentType, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Split } from '../optional-libraries/react-native-screens';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
}

// react-native-screens 4.x types do not declare the column stack and header config added in v5.
// Both are optional here, so the lookups below stay undefined on 4.x.
const SplitWithColumnStacks = Split as typeof Split & {
  Stack?: ComponentType<{ children?: ReactNode }>;
  HeaderConfig?: ComponentType<object>;
};

function isElementOfType(child: ReactNode, type: ComponentType<any> | undefined) {
  return type !== undefined && isValidElement(child) && child.type === type;
}

/**
 * Content of a `Split.Column`. `Split.Column` looks for a direct `Split.Stack` child, and the native split
 * screen accepts a header config only as a direct subview, so neither can be wrapped in `SafeAreaProvider`.
 */
export function renderSplitViewColumnContent(children: ReactNode): ReactNode {
  const childrenArray = Children.toArray(children);
  if (childrenArray.some((child) => isElementOfType(child, SplitWithColumnStacks.Stack))) {
    return children;
  }
  const headerConfigs = childrenArray.filter((child) =>
    isElementOfType(child, SplitWithColumnStacks.HeaderConfig)
  );
  const content = childrenArray.filter(
    (child) => !isElementOfType(child, SplitWithColumnStacks.HeaderConfig)
  );
  return [...headerConfigs, <SafeAreaProvider key="content">{content}</SafeAreaProvider>];
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{renderSplitViewColumnContent(props.children)}</Split.Column>;
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
