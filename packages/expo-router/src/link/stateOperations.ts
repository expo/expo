import {
  InitialState,
  NavigationState,
  ParamListBase,
  PartialState,
  getActionFromState,
} from "@react-navigation/native";

import { ResultState } from "../fork/getStateFromPath";

export type NavigateAction = Extract<
  ReturnType<typeof getActionFromState>,
  { type: "NAVIGATE" }
> & {
  payload: NavigateActionParams;
};

export type NavigateActionParams = {
  params?: NavigateActionParams;
  path: string;
  initial: boolean;
  screen: string;
  name?: string;
};

// Get the last state for a given target state (generated from a path).
function findTopStateForTarget(state: ResultState) {
  let current: Partial<InitialState> | undefined = state;

  while (current?.routes?.[current?.routes?.length - 1].state != null) {
    current = current?.routes[current?.routes.length - 1].state;
  }

  return current;
}

/** Return the absolute last route to move to. */
export function findTopRouteForTarget(state: ResultState) {
  const nextState = findTopStateForTarget(state)!;
  // Ensure we get the last route to prevent returning the initial route.
  return nextState.routes?.[nextState.routes.length - 1]!;
}

/** @returns true if moving to a sibling inside the same navigator. */
export function isMovingToSiblingRoute(
  currentState: NavigationState | PartialState<NavigationState> | undefined,
  targetState: ResultState | undefined
): boolean {
  if (!currentState || !targetState) {
    return false;
  }

  // Need to type this, as the current types are not compaitble with the `find`
  const targetRoute = targetState.routes[0];

  // Make sure we're in the same navigator
  if (!currentState.routeNames?.includes(targetRoute.name)) {
    return false;
  }

  // If there's no state, we're at the end of the path
  if (!targetRoute.state) {
    return true;
  }

  // Coerce the types into a more common form
  const currentRoutes:
    | {
        name: string;
        state?: NavigationState | PartialState<NavigationState>;
      }[]
    | undefined = currentState?.routes;
  const locatedState = currentRoutes?.find((r) => r.name === targetRoute.name);

  if (!locatedState) {
    return false;
  }

  return isMovingToSiblingRoute(locatedState.state, targetRoute.state);
}

// Given the root state and a target state from `getStateFromPath`,
// return the root state containing the highest target route matching the root state.
// This can be used to determine what type of navigator action should be used.
export function getQualifiedStateForTopOfTargetState(
  rootState: InitialState,
  targetState: ResultState
) {
  let current: InitialState | undefined = targetState;
  let currentRoot: InitialState | undefined = rootState;

  while (current?.routes?.[current?.routes?.length - 1].state != null) {
    const nextRoute: any = current?.routes?.[current?.routes?.length - 1];

    const nextCurrentRoot: InitialState | undefined = currentRoot?.routes?.find(
      (route) => route.name === nextRoute.name
    )?.state;

    if (nextCurrentRoot == null) {
      return currentRoot;
      // Not sure what to do -- we're tracking against the assumption that
      // all routes in the target state are in the root state
      // currentRoot = undefined;
    } else {
      currentRoot = nextCurrentRoot;
    }

    current = nextRoute.state;
  }

  return currentRoot;
}

// Given the root state and a target state from `getStateFromPath`,
// return the root state containing the highest target route matching the root state.
// This can be used to determine what type of navigator action should be used.
export function getEarliestMismatchedRoute<T extends ParamListBase>(
  rootState: NavigationState<T> | undefined,
  actionParams: NavigateActionParams
): { name: string; params?: any; type?: string } | null {
  const actionName = actionParams.name ?? actionParams.screen;
  if (!rootState?.routes || rootState.index == null) {
    // This should never happen where there's more action than state.
    return {
      name: actionName,
      type: "stack",
    };
  }

  const nextCurrentRoot = rootState.routes[rootState.index];
  if (actionName === nextCurrentRoot.name) {
    if (!actionParams.params) {
      // All routes match all the way up, no change required.
      return null;
    }

    return getEarliestMismatchedRoute(
      // @react-navigation/native types this as NavigationState | Partial<NavigationState> | undefined
      // In our usage, it's always a NavigationState | undefined
      nextCurrentRoot.state as NavigationState<T> | undefined,
      actionParams.params
    );
  }

  // There's a selected state but it doesn't match the action state
  // this is now the lowest point of change.
  return {
    name: actionName,
    params: actionParams.params,
    type: rootState.type,
  };
}
