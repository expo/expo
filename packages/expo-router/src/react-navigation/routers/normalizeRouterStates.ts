import type { NavigationAction, NavigationState, Router } from './types';

export function normalizeRouterStates<
  State extends NavigationState,
  Action extends NavigationAction,
>(router: Router<State, Action>, normalize: (state: State) => State): Router<State, Action> {
  return {
    ...router,
    getStateForDeclaredRoutes(state, routeNames) {
      return normalize(router.getStateForDeclaredRoutes(state, routeNames));
    },
    getStateForRouteFocus(state, key) {
      return normalize(router.getStateForRouteFocus(state, key));
    },
    getStateForAction(state, action, options) {
      const result = router.getStateForAction(state, action, options);

      if (result === null) {
        return null;
      }

      const normalizedState = normalize(result.state);
      return normalizedState === result.state ? result : { ...result, state: normalizedState };
    },
  };
}
