import { nanoid } from 'nanoid/non-secure';

import type { NavigationState, Route } from '../routers';

type InitialStateOptions = {
  routeNames: string[];
  initialRouteName?: string;
};

export function createInitialState<State extends NavigationState = NavigationState>({
  routeNames,
  initialRouteName,
}: InitialStateOptions): State {
  const focusedRouteName =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0];

  const routes: Route<string>[] = [];

  if (focusedRouteName !== undefined) {
    routes.push({
      key: `${focusedRouteName}-${nanoid()}`,
      name: focusedRouteName,
    });
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
