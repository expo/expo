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
  Router,
  RouterActionResult,
  RouterConfigOptions,
  RouterFactory,
} from './types';

/**
 * A function that returns overrides for an existing router.
 */
export type RouterExtension<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
> = (router: Router<State, Action>, options: RouterOptions) => Partial<Router<State, Action>>;

/**
 * A function that processes the result of an existing router's action handler.
 */
export type RouterActionExtension<
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

/**
 * Extends a router factory with partial overrides of its router implementation.
 *
 * @param createRouter Router factory to extend.
 * @param extension Function that receives the original router and its factory options, and returns
 * its overrides.
 * @returns A router factory that creates the extended router.
 *
 * @example
 * ```ts
 * const CustomTabRouter = extendRouter(TabRouter, (router) => ({
 *   shouldActionChangeFocus(action) {
 *     return action.type === 'CUSTOM_ACTION' || router.shouldActionChangeFocus(action);
 *   },
 * }));
 * ```
 */
export function extendRouter<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
>(
  createRouter: RouterFactory<State, Action, RouterOptions>,
  extension: RouterExtension<State, Action, RouterOptions>
): RouterFactory<State, Action, RouterOptions> {
  return (options) => {
    const router = createRouter(options);
    return { ...router, ...extension(router, options) };
  };
}

/**
 * Extends only the action handling of a router factory. The original router handles the action
 * first, then the extension receives its result. All other router members remain unchanged.
 *
 * @param createRouter Router factory whose action handling is extended.
 * @param extension Function that receives the action, original router result, and router factory
 * options.
 * @returns A router factory that creates the extended router.
 *
 * @example
 * ```ts
 * const CustomTabRouter = extendRouterActions(TabRouter, (state, action, options, result) => {
 *   if (action.type === 'CUSTOM_ACTION') {
 *     return { state, affectedRouteKey: state.routes[state.index]?.key };
 *   }
 *
 *   return result;
 * });
 * ```
 */
export function extendRouterActions<
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
        // The original router treats actions it does not recognize as unhandled and returns `null`.
        const result = router.getStateForAction(state, action as Action, routerConfigOptions);
        return extension(state, action, routerConfigOptions, result, options);
      },
    };
  };
}

/**
 * Extends the stack router with partial overrides of its router implementation.
 */
export function extendStackRouter(
  extension: RouterExtension<
    StackNavigationState<ParamListBase>,
    StackActionType | CommonNavigationAction,
    StackRouterOptions
  >
) {
  return extendRouter(StackRouter, extension);
}

/**
 * Extends the tab router with partial overrides of its router implementation.
 */
export function extendTabRouter(
  extension: RouterExtension<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction,
    TabRouterOptions
  >
) {
  return extendRouter(TabRouter, extension);
}
