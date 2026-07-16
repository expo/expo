'use client';
// TODO: Rename this file to `createStandardDrawerNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { StandardNavigatorContentProps } from '../../../standard-navigation/types';
import type { DrawerNavigationState, ParamListBase } from '../../native';
import type {
  DrawerDescriptorMap,
  DrawerNavigationConfig,
  DrawerNavigationEventMap,
  DrawerNavigationHelpers,
  DrawerNavigationOptions,
} from '../types';
import { DrawerView } from '../views/DrawerView';

export interface DrawerNavigatorCreateProps {
  drawerState: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
}

export interface DrawerNavigatorProps extends DrawerNavigationConfig {
  defaultStatus?: 'open' | 'closed';
}

export type DrawerNavigatorContentProps = DrawerNavigatorProps & DrawerNavigatorCreateProps;

export type StandardDrawerNavigationEventMap = {
  [Event in keyof DrawerNavigationEventMap]: DrawerNavigationEventMap[Event] & {
    canPreventDefault: Event extends 'drawerItemPress' ? true : false;
  };
};

type ContentArgs = StandardNavigatorContentProps<
  DrawerNavigationOptions,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorContentProps
>;

function DrawerNavigatorContent({
  descriptors,
  drawerState,
  navigation,
  defaultStatus = 'closed',
  drawerContent,
  detachInactiveScreens,
}: ContentArgs) {
  return (
    <DrawerView
      state={drawerState}
      navigation={navigation}
      descriptors={descriptors as unknown as DrawerDescriptorMap}
      defaultStatus={defaultStatus}
      drawerContent={drawerContent}
      detachInactiveScreens={detachInactiveScreens}
    />
  );
}

export const createStandardDrawerNavigator = createStandardNavigator<
  DrawerNavigationOptions,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorContentProps
>(DrawerNavigatorContent);
