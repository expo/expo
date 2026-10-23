import type { NativeTabsProps } from 'expo-router/native-tabs';
import { createContext, useContext } from 'react';
import { Button } from 'react-native';

import { ToggleRow } from './ToggleRow';

export const TabBarHiddenContext = createContext<{
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  disableHiddenAnimation: boolean;
  setDisableHiddenAnimation: (disable: boolean) => void;
  preferredPlacement: NativeTabsProps['preferredPlacement'];
  setPreferredPlacement: (placement: NativeTabsProps['preferredPlacement']) => void;
}>({
  hidden: false,
  setHidden: () => {},
  disableHiddenAnimation: false,
  setDisableHiddenAnimation: () => {},
  preferredPlacement: undefined,
  setPreferredPlacement: () => {},
});

const SIDEBAR_PLACEMENTS: NativeTabsProps['preferredPlacement'][] = [
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
    preferredPlacement,
    setPreferredPlacement,
  } = useContext(TabBarHiddenContext);
  const nextPlacement =
    SIDEBAR_PLACEMENTS[
      (SIDEBAR_PLACEMENTS.indexOf(preferredPlacement) + 1) % SIDEBAR_PLACEMENTS.length
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
        title={`Sidebar placement: ${preferredPlacement ?? 'not set'}`}
        testID="sidebar-placement-button"
        onPress={() => setPreferredPlacement(nextPlacement)}
      />
    </>
  );
}
