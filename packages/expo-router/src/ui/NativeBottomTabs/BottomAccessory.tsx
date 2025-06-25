import { use, useEffect } from 'react';
import { type ViewProps } from 'react-native';

import { useBottomTabAccessory } from './NativeTabsViewContext';
import { TabInfoContext } from './TabInfoContext';

export interface BottomAccessoryProps extends ViewProps {}

export function BottomAccessory(props: BottomAccessoryProps) {
  const tabInfo = use(TabInfoContext);
  const { setBottomTabAccessory } = useBottomTabAccessory();

  useEffect(() => {
    if (tabInfo) {
      setBottomTabAccessory(tabInfo.tabKey, props);
    }
  }, []);
  return null;
}
