import type { ComponentProps } from 'react';

import {
  NativeTabsNavigatorWithContext,
  type NativeTabsNavigator,
} from './NativeBottomTabsNavigator';
import { TabTrigger } from './TabOptions';

export const NativeTabs = Object.assign(
  (props: ComponentProps<typeof NativeTabsNavigator>) => {
    return <NativeTabsNavigatorWithContext {...props} />;
  },
  { Trigger: TabTrigger }
);
