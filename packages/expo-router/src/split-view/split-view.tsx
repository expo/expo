import Constants from 'expo-constants';
import React, { createContext, isValidElement, use, type ReactNode } from 'react';
import { SplitViewHost, SplitViewScreen, type SplitViewHostProps } from 'react-native-screens';

import { SplitViewColumn, SplitViewInspector } from './elements';
import { IsWithinLayoutContext } from '../layouts/withLayoutContext';
import { Slot } from '../views/Navigator';

const IsWithinSplitViewContext = createContext(false);

export interface SplitViewProps extends Omit<SplitViewHostProps, 'children'> {
  children?: ReactNode;
}

function SplitViewNavigator({ children, ...splitViewHostProps }: SplitViewProps) {
  if (use(IsWithinSplitViewContext)) {
    throw new Error('There can only be one SplitView in the navigation hierarchy.');
  }

  // TODO: Add better way of detecting if SplitView is rendered inside Native navigator.
  if (use(IsWithinLayoutContext)) {
    throw new Error('SplitView cannot be used inside another navigator, except for Slot.');
  }

  if (!Constants.expoConfig?.extra?.router?.unstable_splitView) {
    throw new Error(
      'SplitView is not enabled. Make sure to enable it in your expo-router configuration with "unstable_splitView": true. After enabling, make sure to prebuild your app.'
    );
  }

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return <Slot />;
  }

  const WrappedSlot = () => (
    <IsWithinLayoutContext value>
      <Slot />
    </IsWithinLayoutContext>
  );

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
    <SplitViewHost key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
      {columnChildren}
      <SplitViewScreen.Column>
        <WrappedSlot />
      </SplitViewScreen.Column>
      {inspectorChildren}
    </SplitViewHost>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
