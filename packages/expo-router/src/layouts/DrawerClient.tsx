'use client';

import {
  createStandardDrawerNavigator,
  getDrawerStatusFromState,
  type DrawerNavigationEventMap,
  type DrawerNavigationOptions,
} from '../react-navigation/drawer';
import type { DrawerNavigatorContentProps } from '../react-navigation/drawer/navigators/createStandardDrawerNavigator';
import {
  DrawerActions,
  DrawerRouter,
  StackActions,
  type DrawerNavigationState,
  type DrawerRouterOptions,
  type ParamListBase,
} from '../react-navigation/native';
import { unstable_integrateWithRouter } from '../standard-navigation';

export const Drawer = unstable_integrateWithRouter<
  DrawerNavigationOptions,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap,
  DrawerNavigatorContentProps,
  DrawerRouterOptions
>(createStandardDrawerNavigator, DrawerRouter, {
  createProps: ({ state, dispatch, navigation }) => {
    const target = state.key;
    return {
      drawerStatus: getDrawerStatusFromState(state),
      preloadedRouteKeys: state.preloadedRouteKeys,
      navigatorKey: state.key,
      isFocused: navigation.isFocused,
      openDrawer: () => dispatch({ ...DrawerActions.openDrawer(), target }),
      closeDrawer: () => dispatch({ ...DrawerActions.closeDrawer(), target }),
      toggleDrawer: () => dispatch({ ...DrawerActions.toggleDrawer(), target }),
      handlePopToTopOnBlur: (routeKey: string) => {
        const route = state.routes.find((r) => r.key === routeKey);
        if (route?.state?.type === 'stack' && route.state.key) {
          dispatch({ ...StackActions.popToTop(), target: route.state.key });
        }
      },
    };
  },
});

export default Drawer;
