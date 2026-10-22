import { createContext, useContext } from 'react';

import { ToggleRow } from './ToggleRow';

export const TabBarHiddenContext = createContext<{
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  disableHiddenAnimation: boolean;
  setDisableHiddenAnimation: (disable: boolean) => void;
}>({
  hidden: false,
  setHidden: () => {},
  disableHiddenAnimation: false,
  setDisableHiddenAnimation: () => {},
});

export function TabBarHiddenToggle() {
  const { hidden, setHidden, disableHiddenAnimation, setDisableHiddenAnimation } =
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
        label="Disable tab bar hide animation"
        testID="disable-hidden-animation-toggle"
        value={disableHiddenAnimation}
        onValueChange={setDisableHiddenAnimation}
      />
    </>
  );
}
