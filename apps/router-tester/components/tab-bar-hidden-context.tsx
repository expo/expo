import { createContext, useContext } from 'react';

import { ToggleRow } from './ToggleRow';

export const TabBarHiddenContext = createContext<{
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}>({
  hidden: false,
  setHidden: () => {},
});

export function TabBarHiddenToggle() {
  const { hidden, setHidden } = useContext(TabBarHiddenContext);

  return (
    <ToggleRow
      label="Hide tab bar"
      testID="hide-tab-bar-toggle"
      value={hidden}
      onValueChange={setHidden}
    />
  );
}
