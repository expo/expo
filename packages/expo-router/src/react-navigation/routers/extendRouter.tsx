import {
  StackRouter,
  type StackActionType,
  type StackNavigationState,
  type StackRouterOptions,
} from './StackRouter';
import {
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

type RouterActionExtension<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
> = (
  state: State,
  action: Action,
  options: RouterConfigOptions,
  result: RouterActionResult<State> | null,
  routerOptions: RouterOptions
) => RouterActionResult<State> | null;

function clearFocusedPreloadedRoute<State extends NavigationState>(
  result: RouterActionResult<State> | null
) {
  if (!result) {
    return result;
  }

  const route = result.state.routes[result.state.index];
  if (!route?.isPreloaded) {
    return result;
  }

  const { isPreloaded, ...focusedRoute } = route;
  const routes = [...result.state.routes];
  // Removing an optional field preserves the route's conditional params type, which TypeScript
  // cannot infer through the `Route` intersection.
  routes[result.state.index] = focusedRoute as typeof route;
  return { ...result, state: { ...result.state, routes } };
}

function extendRouterActions<
  State extends NavigationState,
  Action extends NavigationAction,
  AdditionalAction extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
>(
  createRouter: RouterFactory<State, Action, RouterOptions>,
  extension: RouterActionExtension<State, Action | AdditionalAction, RouterOptions>
): RouterFactory<State, Action | AdditionalAction, RouterOptions> {
  return (options) => {
    const router = createRouter(options);
    return {
      ...router,
      getStateForAction(state, action, routerConfigOptions) {
        // Unknown actions are passed to the extension as unhandled.
        const result = router.getStateForAction(state, action as Action, routerConfigOptions);
        return clearFocusedPreloadedRoute(
          extension(state, action, routerConfigOptions, result, options)
        );
      },
    };
  };
}

/** Extends stack router action handling while preserving the rest of the router implementation. */
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
  >(StackRouter, extension);
}

/** Extends tab router action handling while preserving the rest of the router implementation. */
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
  >(TabRouter, extension);
}
