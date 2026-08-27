import type {
  NavigationAction,
  NavigationState,
  Router,
} from '../../../react-navigation/routers';
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
      : (state, action) =>
          // The registry erases each router's narrower state and action unions at this boundary.
          reduceOrRouter.getStateForAction(state as State, action as Action, {
            routeNames: routeNames!,
            routeGetIdList: {},
          });

  return {
    reduce,
    shouldActionChangeFocus: () => false,
    getStateForRouteFocus: (state) => state,
    shouldPreventRemove: () => false,
    emitBeforeRemove: () => {},
  };
}
