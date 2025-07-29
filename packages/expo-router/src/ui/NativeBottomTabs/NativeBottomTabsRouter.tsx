import {
  CommonNavigationAction,
  ParamListBase,
  Router,
  TabActionType,
  TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '@react-navigation/native';

export function NativeBottomTabsRouter(options: TabRouterOptions) {
  const tabRouter = TabRouter({ ...options });

  const nativeTabRouter: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...tabRouter,
  };

  return nativeTabRouter;
}
