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
import type {
  NativeStackHeaderItemProps,
  NativeStackNavigationOptions,
} from '../../../react-navigation/native-stack';

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

  const headerContent = (props: NativeStackHeaderItemProps) => (
    <HeaderToolbarHostBase placement={placement} colors={colors} headerProps={props}>
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

function HeaderToolbarHostBase({
  children,
  placement,
  colors,
  headerProps,
}: {
  children: ReactNode;
  placement: ToolbarPlacement;
  colors?: ToolbarColors;
  headerProps?: NativeStackHeaderItemProps;
}) {
  const stableColors = useMemo(
    () => ({
      tintColor: colors?.tintColor ?? headerProps?.tintColor,
      backgroundColor: colors?.backgroundColor ?? headerProps?.backgroundColor,
    }),
    [
      colors?.backgroundColor,
      colors?.tintColor,
      headerProps?.tintColor,
      headerProps?.backgroundColor,
    ]
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
