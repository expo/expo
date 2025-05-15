import { useNavigationBuilder } from '@react-navigation/native';
import { PropsWithChildren } from 'react';

import { NativeProps, NativeTabsView } from './NativeBottomTabs';
import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';

export function NativeTabs({ children }: PropsWithChildren<NativeProps>) {
  const builder = useNavigationBuilder(NativeBottomTabsRouter, {
    children,
  });

  return <NativeTabsView builder={builder} />;
}
