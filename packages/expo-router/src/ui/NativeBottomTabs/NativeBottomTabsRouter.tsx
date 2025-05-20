import {
  CommonNavigationAction,
  ParamListBase,
  Router,
  TabActionType,
  TabNavigationState,
  TabRouter,
} from '@react-navigation/native';

export function NativeBottomTabsRouter(options: any) {
  const tabRouter = TabRouter(options);

  const nativeTabRouter: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...tabRouter,
  };

  return nativeTabRouter;
}
