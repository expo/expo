import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplitViewHost, SplitViewScreen } from 'react-native-screens/experimental';

import { SidebarHeader, SidebarTrigger } from './elements';
import type { SidebarProps } from './types';
import { Slot } from '../views/Navigator';

const ParentSideBarContext = React.createContext(0);
const ChildrenSideBarContext = React.createContext({ addChild: () => {}, removeChild: () => {} });

function SidebarNavigator({ children, displayMode }: SidebarProps) {
  const numberOfParentSidebars = React.useContext(ParentSideBarContext);
  const { addChild, removeChild } = React.useContext(ChildrenSideBarContext);

  const [numberOfChildrenSidebars, setNumberOfChildrenSidebars] = React.useState(0);

  const value = React.useMemo(
    () => ({
      addChild: () => setNumberOfChildrenSidebars((c) => c + 1),
      removeChild: () => setNumberOfChildrenSidebars((c) => c - 1),
    }),
    []
  );

  useEffect(() => {
    addChild();
    return () => {
      removeChild();
    };
  }, []);

  if (numberOfParentSidebars > 1) {
    throw new Error('Sidebar cannot be nested more than one level deep');
  }

  useEffect(() => {
    if (numberOfChildrenSidebars > 0 && displayMode) {
      console.warn('`displayMode` can only be set on the primary sidebar.');
    }
  }, [displayMode]);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ParentSideBarContext value={numberOfParentSidebars + 1}>
      <ChildrenSideBarContext value={value}>{children}</ChildrenSideBarContext>
    </ParentSideBarContext>
  );

  if (numberOfParentSidebars > 0) {
    return (
      <Wrapper>
        <SplitViewScreen.Column>{children}</SplitViewScreen.Column>
        <SplitViewScreen.Column>
          <Slot />
        </SplitViewScreen.Column>
      </Wrapper>
    );
  }

  const numberOfScreens = numberOfChildrenSidebars === 0 ? 'one' : 'two';
  const mode = displayMode === 'over' ? 'Over' : 'Beside';
  const preferredDisplayMode = `${numberOfScreens}${mode}Secondary` as const;

  return (
    <Wrapper>
      <SplitViewHost
        key={numberOfChildrenSidebars}
        preferredDisplayMode={preferredDisplayMode}
        displayModeButtonVisibility="always">
        <SplitViewScreen.Column>
          <SafeAreaProvider>{children}</SafeAreaProvider>
        </SplitViewScreen.Column>
        {numberOfChildrenSidebars === 0 ? (
          <>
            <SplitViewScreen.Column />
            <SplitViewScreen.Column>
              <Slot />
            </SplitViewScreen.Column>
          </>
        ) : (
          <Slot />
        )}
      </SplitViewHost>
    </Wrapper>
  );
}

export const Sidebar = Object.assign(SidebarNavigator, {
  Trigger: SidebarTrigger,
  Header: SidebarHeader,
});
