import React, {
  createContext,
  forwardRef,
  isValidElement,
  use,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { Split, type SplitHostProps } from 'react-native-screens/experimental';

import { SplitViewColumn, SplitViewInspector } from './elements';
import { SplitViewStack } from './split-view-stack';
import { IsWithinLayoutContext } from '../layouts/IsWithinLayoutContext';
import { Slot } from '../views/Navigator';

export type { SplitViewRef } from './split-view-stack';

const IsWithinSplitViewContext = createContext(false);

/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
  children?: ReactNode;
}

const SplitViewNavigator = forwardRef<import('./split-view-stack').SplitViewRef, SplitViewProps>(
  function SplitViewNavigator({ children, ...splitViewHostProps }, ref) {
    if (use(IsWithinSplitViewContext)) {
      throw new Error('There can only be one SplitView in the navigation hierarchy.');
    }

    // TODO: Add better way of detecting if SplitView is rendered inside Native navigator.
    if (use(IsWithinLayoutContext)) {
      throw new Error('SplitView cannot be used inside another navigator, except for Slot.');
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
    ) as ReactElement<import('./elements').SplitViewColumnProps>[];
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

    // On iPhone, render a ScreenStack instead of Split.Host
    if (!(Platform.OS === 'ios' && Platform.isPad)) {
      if (numberOfInspectors > 0) {
        console.warn('SplitView.Inspector is not supported on iPhone and will be ignored.');
      }
      return <SplitViewStack key={numberOfSidebars} ref={ref} columnChildren={columnChildren} />;
    }

    const WrappedSlot = () => (
      <IsWithinLayoutContext value>
        <Slot />
      </IsWithinLayoutContext>
    );

    // The key is needed, because number of columns cannot be changed dynamically
    return (
      <Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
        {columnChildren}
        <Split.Column>
          <WrappedSlot />
        </Split.Column>
        {inspectorChildren}
      </Split.Host>
    );
  }
);

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
