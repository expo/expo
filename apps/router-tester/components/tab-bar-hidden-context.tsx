import type { NativeTabsProps } from 'expo-router/native-tabs';
import { createContext, useContext } from 'react';
import { Button } from 'react-native';

import { ToggleRow } from './ToggleRow';

export const TabBarHiddenContext = createContext<{
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  disableHiddenAnimation: boolean;
  setDisableHiddenAnimation: (disable: boolean) => void;
  sidebarPreferredPlacement: NativeTabsProps['sidebarPreferredPlacement'];
  setSidebarPreferredPlacement: (placement: NativeTabsProps['sidebarPreferredPlacement']) => void;
}>({
  hidden: false,
  setHidden: () => {},
  disableHiddenAnimation: false,
  setDisableHiddenAnimation: () => {},
  sidebarPreferredPlacement: undefined,
  setSidebarPreferredPlacement: () => {},
});

const SIDEBAR_PLACEMENTS: NativeTabsProps['sidebarPreferredPlacement'][] = [
  undefined,
  'automatic',
  'sidebar',
  'tabBar',
];

export function TabBarHiddenToggle() {
  const {
    hidden,
    setHidden,
    disableHiddenAnimation,
    setDisableHiddenAnimation,
    sidebarPreferredPlacement,
    setSidebarPreferredPlacement,
  } = useContext(TabBarHiddenContext);
  const nextPlacement =
    SIDEBAR_PLACEMENTS[
      (SIDEBAR_PLACEMENTS.indexOf(sidebarPreferredPlacement) + 1) % SIDEBAR_PLACEMENTS.length
    ];

  return (
    <>
      <ToggleRow
        label="Hide tab bar"
        testID="hide-tab-bar-toggle"
        value={hidden}
        onValueChange={setHidden}
      />
      <ToggleRow
        label="Disable tab bar hide animation"
        testID="disable-hidden-animation-toggle"
        value={disableHiddenAnimation}
        onValueChange={setDisableHiddenAnimation}
      />
      <Button
        title={`Sidebar placement: ${sidebarPreferredPlacement ?? 'not set'}`}
        testID="sidebar-placement-button"
        onPress={() => setSidebarPreferredPlacement(nextPlacement)}
      />
    </>
  );
}
