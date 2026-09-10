import {
  markPreloadedRoutes,
  StackRouter,
  type StackActionType,
  type StackNavigationState,
  type StackRouterOptions,
} from './StackRouter';
import {
  clearFocusedPreloadedRoute,
  TabRouter,
  type TabActionType,
  type TabNavigationState,
  type TabRouterOptions,
} from './TabRouter';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationAction,
  NavigationState,
  ParamListBase,
  RouterActionResult,
  RouterConfigOptions,
  RouterFactory,
} from './types';

export type RouterActionExtension<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
> = (
  state: State,
  action: Action,
  options: RouterConfigOptions,
  baseActionHandler: (
    state: State,
    action: Action,
    options: RouterConfigOptions
  ) => RouterActionResult<State> | null,
  routerOptions: RouterOptions
) => RouterActionResult<State> | null;

function extendRouterActions<
  State extends NavigationState,
  Action extends NavigationAction,
  AdditionalAction extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
>(
  createRouter: RouterFactory<State, Action, RouterOptions>,
  extension: RouterActionExtension<State, Action | AdditionalAction, RouterOptions>,
  normalizeState: (state: State) => State
): RouterFactory<State, Action | AdditionalAction, RouterOptions> {
  return (options) => {
    const router = createRouter(options);
    return {
      ...router,
      getStateForAction(state, action, routerConfigOptions) {
        const baseActionHandler = (
          state: State,
          action: Action | AdditionalAction,
          routerConfigOptions: RouterConfigOptions
        ) =>
          // The base router treats actions it does not recognize as unhandled.
          router.getStateForAction(state, action as Action, routerConfigOptions);
        const result = extension(state, action, routerConfigOptions, baseActionHandler, options);
        const actionResult = result ?? baseActionHandler(state, action, routerConfigOptions);
        return actionResult ? { ...actionResult, state: normalizeState(actionResult.state) } : null;
      },
    };
  };
}

/**
 * Extends stack router action handling while preserving the rest of the router implementation.
 * Custom actions must be dispatched directly and do not change parent focus unless handled by the
 * base router.
 */
export function extendStackRouterActions<AdditionalAction extends NavigationAction>(
  extension: RouterActionExtension<
    StackNavigationState<ParamListBase>,
    StackActionType | CommonNavigationAction | AdditionalAction,
    StackRouterOptions
  >
) {
  return extendRouterActions<
    StackNavigationState<ParamListBase>,
    StackActionType | CommonNavigationAction,
    AdditionalAction,
    StackRouterOptions
  >(StackRouter, extension, markPreloadedRoutes);
}

/**
 * Extends tab router action handling while preserving the rest of the router implementation.
 * Custom actions must be dispatched directly and do not change parent focus unless handled by the
 * base router.
 */
export function extendTabRouterActions<AdditionalAction extends NavigationAction>(
  extension: RouterActionExtension<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction | AdditionalAction,
    TabRouterOptions
  >
) {
  return extendRouterActions<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction,
    AdditionalAction,
    TabRouterOptions
  >(TabRouter, extension, clearFocusedPreloadedRoute);
}
