import React, { isValidElement, use, type ReactNode } from 'react';
import { Split, type SplitHostProps } from 'react-native-screens/experimental';

import { IsWithinNativeNavigator } from '../standard-navigation';
import { Slot } from '../views/Navigator';
import { SplitViewColumn, SplitViewInspector } from './elements';

/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
  children?: ReactNode;
}

function SplitViewNavigator({ children, ...splitViewHostProps }: SplitViewProps) {
  if (use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return <Slot />;
  }

  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter(
    (child) => isValidElement(child) && child.type === SplitViewColumn
  );
  const inspectorChildren = allChildrenArray.filter(
    (child) => isValidElement(child) && child.type === SplitViewInspector
  );
  const numberOfSidebars = columnChildren.length;
  const numberOfInspectors = inspectorChildren.length;

  if (allChildrenArray.length !== columnChildren.length + inspectorChildren.length) {
    console.warn(
      'Only SplitView.Column and SplitView.Inspector components are allowed as direct children of SplitView.'
    );
  }

  if (numberOfSidebars > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  if (numberOfSidebars + numberOfInspectors === 0) {
    console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
    return <Slot />;
  }

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
        {columnChildren}
        <Split.Column>
          <Slot />
        </Split.Column>
        {inspectorChildren}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
