'use client';
import { Host, Row } from '@expo/ui/jetpack-compose';
import type { PropsWithChildren, ReactNode } from 'react';

import { ToolbarPlacementContext, type ToolbarPlacement } from './context';
import { NativeMenuContext } from '../../../link/NativeMenuContext';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';

/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
export function processHeaderItemsForPlatform(
  children: ReactNode,
  placement: ToolbarPlacement
): NativeStackNavigationOptions | null {
  if (placement !== 'left' && placement !== 'right') {
    return null;
  }

  const headerContent = () => {
    return <HeaderToolbarHostBase placement={placement}>{children}</HeaderToolbarHostBase>;
  };

  if (placement === 'left') {
    return {
      headerShown: true,
      headerLeft: headerContent,
    };
  }

  return {
    headerShown: true,
    headerRight: headerContent,
  };
}

function HeaderToolbarHostBase({
  children,
  placement,
}: PropsWithChildren & { placement: ToolbarPlacement }) {
  return (
    <ToolbarPlacementContext.Provider value={placement}>
      <NativeMenuContext value>
        <Host matchContents>
          <Row verticalAlignment="center">{children}</Row>
        </Host>
      </NativeMenuContext>
    </ToolbarPlacementContext.Provider>
  );
}
