import React, { createContext, isValidElement } from 'react';
import { SplitViewHost, SplitViewScreen } from 'react-native-screens/experimental';

import { SplitViewColumn } from './elements';
import type { SidebarProps } from './types';
import { Slot } from '../views/Navigator';
import { View } from 'react-native';

const SplitViewContext = createContext(0);

function SplitViewNavigator({ children, displayMode }: SidebarProps) {
  const numberOfParentSidebars = React.useContext(SplitViewContext);

  if (numberOfParentSidebars > 0) {
    throw new Error('There can only be one SplitView in the navigation hierarchy.');
  }

  const WrappedSlot = () => (
    <SplitViewContext value={numberOfParentSidebars + 1}>
      <Slot />
    </SplitViewContext>
  );

  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter(
    (child) => isValidElement(child) && child.type === SplitViewColumn
  );
  const numberOfSidebars = columnChildren.length;

  if (allChildrenArray.length !== columnChildren.length) {
    console.warn('Only SplitView.Column components are allowed as direct children of SplitView.');
  }

  if (numberOfSidebars > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  const numberOfScreens = numberOfSidebars === 1 ? 'one' : 'two';
  const mode = displayMode === 'over' ? 'Over' : 'Beside';
  const preferredDisplayMode =
    numberOfSidebars === 0 ? 'secondaryOnly' : (`${numberOfScreens}${mode}Secondary` as const);


  return (
    <SplitViewHost
      preferredDisplayMode={preferredDisplayMode}
      preferredSplitBehavior="tile"
      displayModeButtonVisibility="always">
      {numberOfSidebars === 0 && (
        <SplitViewScreen.Column>
          <View />
        </SplitViewScreen.Column>
      )}
      {numberOfSidebars < 2 && (
        <SplitViewScreen.Column>
          <View />
        </SplitViewScreen.Column>
      )}
      {columnChildren}
      <SplitViewScreen.Column>
        <WrappedSlot />
      </SplitViewScreen.Column>
    </SplitViewHost>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
});
