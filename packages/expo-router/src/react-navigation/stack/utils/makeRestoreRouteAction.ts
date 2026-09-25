import type { ParamListBase, Route, StackNavigationState } from '../../native';
import { CommonActions } from '../../native';

export function makeRestoreRouteAction(
  dispatchSync: (action: ReturnType<typeof CommonActions.reset>) => void,
  state: StackNavigationState<ParamListBase>
) {
  return (route: Route<string>) => {
    if (!state.routeNames.includes(route.name)) {
      return false;
    }

    const activeRoutes = state.routes
      .slice(0, state.index + 1)
      .filter((currentRoute) => currentRoute.key !== route.key);
    const preloadedRoutes = state.routes
      .slice(state.index + 1)
      .filter((currentRoute) => currentRoute.key !== route.key);
    const routes = [...activeRoutes, route];

    dispatchSync(
      CommonActions.reset({
        ...state,
        routes: routes.concat(preloadedRoutes),
        index: routes.length - 1,
      })
    );
    return true;
  };
}
