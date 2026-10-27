import React, { isValidElement, use, type ReactElement, type ReactNode } from 'react';

import { Split, type SplitHostProps } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { Slot } from '../views/Navigator';
import {
  getSplitColumnChildren,
  SplitViewColumn,
  SplitViewInspector,
  SplitViewStack,
  type SplitViewColumnProps,
  type SplitViewStackProps,
} from './elements';

/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
  children?: ReactNode;
  /**
   * Enables React Activity for screens rendered by the detail slot.
   * @default false
   */
  activityEnabled?: boolean;
  /**
   * Disables the left and right safe area insets that SplitView applies to the content of each column and inspector.
   * @default false
   */
  disableHorizontalSafeAreaInsets?: boolean;
}

let didWarnMissingStack = false;

function SplitViewNavigator({
  children,
  activityEnabled,
  disableHorizontalSafeAreaInsets,
  ...splitViewHostProps
}: SplitViewProps) {
  if (use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return <Slot activityEnabled={activityEnabled} />;
  }

  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewColumn
  );
  const inspectorChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewInspector
  );
  const stackChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewStackProps> =>
      isValidElement(child) && child.type === SplitViewStack
  );
  const numberOfSidebars = columnChildren.length;
  const numberOfInspectors = inspectorChildren.length;

  if (
    allChildrenArray.length !==
    columnChildren.length + inspectorChildren.length + stackChildren.length
  ) {
    console.warn(
      'Only SplitView.Column, SplitView.Stack and SplitView.Inspector components are allowed as direct children of SplitView.'
    );
  }

  if (numberOfSidebars > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  if (stackChildren.length > 1) {
    throw new Error('There can only be one SplitView.Stack in the SplitView.');
  }

  if (numberOfSidebars + numberOfInspectors === 0) {
    console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
    return <Slot activityEnabled={activityEnabled} />;
  }

  if (process.env.NODE_ENV !== 'production' && stackChildren.length === 0 && !didWarnMissingStack) {
    didWarnMissingStack = true;
    console.warn(
      'SplitView.Stack is missing. Add <SplitView.Stack /> to SplitView to configure the content column.'
    );
  }

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child) => (
    <Split.Column key={child.key}>
      {getSplitColumnChildren(child.props, disableHorizontalSafeAreaInsets)}
    </Split.Column>
  ));
  const inspectors = inspectorChildren.map((child) => (
    <Split.Inspector key={child.key}>
      {getSplitColumnChildren(child.props, disableHorizontalSafeAreaInsets)}
    </Split.Inspector>
  ));
  const stackHeader = stackChildren[0]?.props.header;

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
        {columns}
        <Split.Column>
          {getSplitColumnChildren(
            { children: <Slot activityEnabled={activityEnabled} />, header: stackHeader },
            disableHorizontalSafeAreaInsets
          )}
        </Split.Column>
        {inspectors}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Stack: SplitViewStack,
  Inspector: SplitViewInspector,
});
