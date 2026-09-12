import type { NavigationState, Route } from '../routers';
import { createNavigatorStateKey, createRouteKeyMinter } from '../routers/stateKeys';

type InitialStateOptions = {
  routeNames: string[];
  initialRouteName?: string;
  parentChain: string;
};

export function createInitialState<State extends NavigationState = NavigationState>({
  routeNames,
  initialRouteName,
  parentChain,
}: InitialStateOptions): State {
  const focusedRouteName =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0];

  const routes: Route<string>[] = [];
  const key = createNavigatorStateKey(parentChain);
  const minter = createRouteKeyMinter({ key, routeKeySeq: 0 });

  if (focusedRouteName !== undefined) {
    routes.push({
      key: minter.mint(focusedRouteName),
      name: focusedRouteName,
    });
  }

  // TODO(@ubax): Improve these typings by distinguishing initial state from complete state types.
  // Router state types may narrow the shared metadata added later by actions.
  return {
    stale: false,
    key,
    routeKeySeq: minter.routeKeySeq,
    index: routes.length - 1,
    routeNames,
    routes,
  } as State;
}
