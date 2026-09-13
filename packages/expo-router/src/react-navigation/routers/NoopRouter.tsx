import type {
  DefaultRouterOptions,
  NavigationAction,
  NavigationState,
  RouterFactory,
} from './types';

/**
 * Router that handles nothing. It is the root of the built-in router chain: every other router
 * is created by extending it, directly or through `BaseRouter`.
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
