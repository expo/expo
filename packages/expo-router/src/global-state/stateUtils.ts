import type { ResultState } from '../fork/getStateFromPath';
import { matchDynamicName } from '../matchers';
import type { PartialRoute, NavigationState, PartialState } from '../react-navigation/native';

/**
 * Traverse the state tree comparing the current state and the action state until we find where they diverge.
 *
 * @returns An object with:
 *  - `actionState` — the remaining action state at the point of divergence
 *  - `navigationState` — the navigator that should be targeted for the dispatched action
 *  - `actionStateRoute` — the specific route in the action state where divergence was detected
 *  - `navigationRoutes` — navigation routes that matched before divergence (used for tab targeting)
 *
 * @private
 */
export function findDivergentState(
  _actionState: ResultState,
  _navigationState: NavigationState,
  // TODO: Convert these positional options to an object if more are added.
  lookThroughAllTabs = false,
  isMounted: (key: string) => boolean = () => true
) {
  let actionState: PartialState<NavigationState> | undefined = _actionState;
  let navigationState: NavigationState | undefined = _navigationState;
  let actionStateRoute: PartialRoute<any> | undefined;
  const navigationRoutes = [];
  while (actionState && navigationState) {
    // TODO(@kitten): Review invalid indexed access into undefined
    actionStateRoute = actionState.routes[actionState.index ?? actionState.routes.length - 1]!;
    // TODO(ENG-22021): Resolve navigator types independently of state for the tab checks in this loop.
    // https://linear.app/expo/issue/ENG-22021/fix-link-preview-by-detecting-navigator-type-on-native
    const stateRoute: NavigationState['routes'][number] = (() => {
      if (navigationState.type === 'tab' && lookThroughAllTabs) {
        return (
          navigationState.routes.find((route) => route.name === actionStateRoute?.name) ||
          navigationState.routes[navigationState.index ?? 0]!
        );
      }
      return navigationState.routes[navigationState.index ?? 0]!;
    })();

    const childState: PartialState<NavigationState> | undefined = actionStateRoute.state;
    const nextNavigationState = stateRoute.state;

    const dynamicName = matchDynamicName(actionStateRoute!.name);

    const didActionAndCurrentStateDiverge =
      actionStateRoute.name !== stateRoute.name ||
      !childState ||
      !nextNavigationState ||
      !isKeyedNavigationState(nextNavigationState) ||
      !isMounted(nextNavigationState.key) ||
      (dynamicName &&
        actionStateRoute.params?.[dynamicName.name] !==
          (stateRoute.params as Record<string, any> | undefined)?.[dynamicName.name]);

    if (didActionAndCurrentStateDiverge) {
      // If we are looking through all tabs, we need to add new tab id if this is the last route
      // Otherwise we wouldn't be able to change the tab
      if (navigationState.type === 'tab' && lookThroughAllTabs) {
        navigationRoutes.push(stateRoute);
      }
      break;
    }

    navigationRoutes.push(stateRoute);

    actionState = childState;
    navigationState = nextNavigationState;
  }

  return {
    actionState,
    navigationState,
    actionStateRoute,
    navigationRoutes,
  };
}

function isKeyedNavigationState(
  state: NavigationState | PartialState<NavigationState> | undefined
): state is NavigationState {
  return typeof state?.key === 'string';
}
