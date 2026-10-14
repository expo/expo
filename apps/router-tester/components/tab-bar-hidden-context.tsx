import { createContext, useContext } from 'react';

import { ToggleRow } from './ToggleRow';

export const TabBarHiddenContext = createContext<{
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  hiddenAnimationEnabled: boolean;
  setHiddenAnimationEnabled: (enabled: boolean) => void;
}>({
  hidden: false,
  setHidden: () => {},
  hiddenAnimationEnabled: true,
  setHiddenAnimationEnabled: () => {},
});

export function TabBarHiddenToggles() {
  const { hidden, setHidden, hiddenAnimationEnabled, setHiddenAnimationEnabled } =
    useContext(TabBarHiddenContext);

  return (
    <>
      <ToggleRow
        label="Hide tab bar"
        testID="hide-tab-bar-toggle"
        value={hidden}
        onValueChange={setHidden}
      />
      <ToggleRow
        label="Animate tab bar hide"
        testID="hide-tab-bar-animation-toggle"
        value={hiddenAnimationEnabled}
        onValueChange={setHiddenAnimationEnabled}
      />
    </>
  );
}
