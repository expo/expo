import { nanoid } from 'nanoid/non-secure';

import type { NavigationState, ParamListBase, Route } from '../routers';
import type { NavigatorScreenParams } from './types';

type InitialStateOptions = {
  routeNames: string[];
  initialRouteName?: string;
  routeParams?: NavigatorScreenParams<ParamListBase>;
};

export function createInitialState<State extends NavigationState = NavigationState>({
  routeNames,
  initialRouteName,
  routeParams,
}: InitialStateOptions): State {
  const configuredInitialRouteName =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0];
  const focusedRouteName =
    typeof routeParams?.screen === 'string' && routeNames.includes(routeParams.screen)
      ? routeParams.screen
      : configuredInitialRouteName;
  const usesNestedRouteParams = routeParams?.screen === focusedRouteName;

  const createRoute = (name: string, focused: boolean): Route<string> => {
    const params = focused && usesNestedRouteParams ? routeParams?.params : undefined;
    const path = focused && usesNestedRouteParams ? routeParams?.path : undefined;

    return {
      key: `${name}-${nanoid()}`,
      name,
      // Copy params so the child's route params don't alias the parent's nested params.
      ...(params !== undefined ? { params: { ...params } } : undefined),
      ...(path !== undefined ? { path } : undefined),
    };
  };

  const routes: Route<string>[] = [];

  if (
    routeParams?.initial === false &&
    configuredInitialRouteName !== undefined &&
    configuredInitialRouteName !== focusedRouteName
  ) {
    routes.push(createRoute(configuredInitialRouteName, false));
  }

  if (focusedRouteName !== undefined) {
    routes.push(createRoute(focusedRouteName, true));
  }

  // TODO(@ubax): Improve these typings by distinguishing initial state from hydrated state types.
  // Router state types may narrow the shared metadata added later by rehydration and actions.
  return {
    stale: false,
    key: `navigator-${nanoid()}`,
    index: routes.length - 1,
    routeNames,
    routes,
  } as State;
}
