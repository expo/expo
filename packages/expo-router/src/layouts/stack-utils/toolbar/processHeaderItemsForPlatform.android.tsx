'use client';
import { Host, Row } from '@expo/ui/jetpack-compose';
import { type ReactNode, useMemo } from 'react';

import {
  ToolbarColorContext,
  ToolbarPlacementContext,
  type ToolbarColors,
  type ToolbarPlacement,
} from './context';
import { NativeMenuContext } from '../../../link/NativeMenuContext';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';

/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
export function processHeaderItemsForPlatform(
  children: ReactNode,
  placement: ToolbarPlacement,
  colors?: ToolbarColors
): NativeStackNavigationOptions | null {
  if (placement !== 'left' && placement !== 'right') {
    return null;
  }

  const headerContent = () => (
    <HeaderToolbarHostBase placement={placement} colors={colors}>
      {children}
    </HeaderToolbarHostBase>
  );

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
const EMPTY_COLORS: ToolbarColors = {};

function HeaderToolbarHostBase({
  children,
  placement,
  colors,
}: {
  children: ReactNode;
  placement: ToolbarPlacement;
  colors?: ToolbarColors;
}) {
  const stableColors = useMemo(
    () => colors ?? EMPTY_COLORS,
    [colors?.backgroundColor, colors?.tintColor]
  );

  return (
    <ToolbarPlacementContext.Provider value={placement}>
      <ToolbarColorContext.Provider value={stableColors}>
        <NativeMenuContext value>
          <Host matchContents>
            <Row verticalAlignment="center">{children}</Row>
          </Host>
        </NativeMenuContext>
      </ToolbarColorContext.Provider>
    </ToolbarPlacementContext.Provider>
  );
}
