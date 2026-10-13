import type {
  NavigationAction,
  NavigationState,
  Router,
} from '../../../react-navigation/routers';
import { isActionRejected } from '../../../react-navigation/routers/extendRouter';
import type { RouterRegistryEntry } from '../../routerRegistry';

export function entry(reduce: RouterRegistryEntry['reduce']): RouterRegistryEntry;
export function entry<State extends NavigationState, Action extends NavigationAction>(
  router: Router<State, Action>,
  routeNames: string[]
): RouterRegistryEntry;
export function entry<State extends NavigationState, Action extends NavigationAction>(
  reduceOrRouter: RouterRegistryEntry['reduce'] | Router<State, Action>,
  routeNames?: string[]
): RouterRegistryEntry {
  const reduce: RouterRegistryEntry['reduce'] =
    typeof reduceOrRouter === 'function'
      ? reduceOrRouter
      : (state, action) => {
          // The registry erases each router's narrower state and action unions at this boundary.
          const result = reduceOrRouter.getStateForAction(state as State, action as Action, {
            routeNames: routeNames!,
            routeGetIdList: {},
          });
          // Same as `useNavigationBuilder`: the registry marks a rejected action with `null`.
          return isActionRejected(result) ? null : result;
        };

  return {
    reduce,
    getBrowserHistoryForRouteFocus: typeof reduceOrRouter === 'function' ? undefined :
      (previous, next, childAction) => reduceOrRouter.getBrowserHistoryForRouteFocus?.(previous as State, next as State, childAction),
    shouldActionChangeFocus: () => false,
    getStateForRouteFocus: (state) => state,
  };
}
