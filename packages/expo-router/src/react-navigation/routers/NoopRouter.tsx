import type {
  DefaultRouterOptions,
  NavigationAction,
  NavigationState,
  RouterFactory,
} from './types';

/**
 * Router that handles nothing. `BaseRouter` extends it, so it is the root of every built-in
 * router chain.
 */
export const NoopRouter: RouterFactory<
  NavigationState,
  NavigationAction,
  DefaultRouterOptions
> = () => ({
  getStateForDeclaredRoutes: (state) => state,
  getStateForRouteFocus: (state) => state,
  getStateForAction: () => null,
  shouldActionChangeFocus: () => false,
});
