'use client';
import { createStandardNavigator } from 'standard-navigation';

import type { StandardNavigatorContentProps } from '../../../standard-navigation/types';
import { type DrawerStatus } from '../../native';
import type {
  DrawerDescriptorMap,
  DrawerNavigationConfig,
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
} from '../types';
import { DrawerView } from '../views/DrawerView';

/**
 * Props injected into the drawer's `NavigatorContent` on top of the standard-navigation `NavigatorArgs`.
 * `defaultStatus`/`drawerContent`/`detachInactiveScreens` flow in as plain navigator props; the rest are
 * derived from the raw navigator state/dispatch/navigation in `DrawerClient`'s `createProps`.
 *
 * All of these are optional on the public navigator component (the user never passes them); `createProps`
 * supplies them at runtime, so the content component asserts their presence when forwarding to `DrawerView`.
 */
export interface DrawerNavigatorContentProps extends DrawerNavigationConfig {
  defaultStatus?: DrawerStatus;
  drawerStatus?: DrawerStatus;
  preloadedRouteKeys?: readonly string[];
  navigatorKey?: string;
  isFocused?: () => boolean;
  openDrawer?: () => void;
  closeDrawer?: () => void;
  toggleDrawer?: () => void;
  handlePopToTopOnBlur?: (routeKey: string) => void;
}

type ContentArgs = StandardNavigatorContentProps<
  DrawerNavigationOptions,
  DrawerNavigationEventMap,
  DrawerNavigatorContentProps
>;

function DrawerNavigatorContent({
  state,
  descriptors,
  actions,
  emitter,
  drawerStatus,
  preloadedRouteKeys,
  navigatorKey,
  isFocused,
  openDrawer,
  closeDrawer,
  toggleDrawer,
  handlePopToTopOnBlur,
  defaultStatus = 'closed',
  drawerContent,
  detachInactiveScreens,
}: ContentArgs) {
  // The standard contract narrows descriptors to `{ options, render }`, but the integration layer forwards
  // the real react-navigation drawer descriptors at runtime, so headers/screens can read `.navigation`/`.route`.
  const drawerDescriptors = descriptors as unknown as DrawerDescriptorMap;

  // These are always supplied by `DrawerClient`'s `createProps`; they are optional on the public component
  // only so the user is not forced to pass them. The `!` assertions reflect that runtime guarantee.
  return (
    <DrawerView
      state={state}
      descriptors={drawerDescriptors}
      defaultStatus={defaultStatus}
      drawerStatus={drawerStatus!}
      preloadedRouteKeys={preloadedRouteKeys!}
      navigatorKey={navigatorKey!}
      drawerContent={drawerContent}
      detachInactiveScreens={detachInactiveScreens}
      emit={emitter.emit}
      isFocused={isFocused!}
      navigate={actions.navigate}
      goBack={actions.back}
      openDrawer={openDrawer!}
      closeDrawer={closeDrawer!}
      toggleDrawer={toggleDrawer!}
      handlePopToTopOnBlur={handlePopToTopOnBlur!}
    />
  );
}

export const createStandardDrawerNavigator = createStandardNavigator<
  DrawerNavigationOptions,
  DrawerNavigationEventMap,
  DrawerNavigatorContentProps
>(DrawerNavigatorContent);
