import { createRouteKeyMinter } from './stateKeys';
import type {
  DefaultRouterOptions,
  NavigationAction,
  NavigationState,
  Router,
  RouterActionResult,
  RouterConfigOptions,
  RouterFactory,
} from './types';

export type RouterExtensionContext<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = {
  /**
   * The router being extended. Delegate to it for everything the extension does not handle.
   * It is typed for the extended state and actions; actions it does not recognize return `null`.
   */
  baseRouter: Router<State, Action>;
  /**
   * The options the navigator passed to the router factory.
   */
  options: Options;
  /**
   * Creates a route key minter for a navigation state. Write the minter's `routeKeySeq` back
   * onto the state you return.
   */
  createRouteKeyMinter: typeof createRouteKeyMinter;
};

/**
 * Returns the router members to merge over the base router. Members that are left out are
 * inherited from the base router, including `actionCreators`: return a merged object to add
 * action creators instead of replacing them.
 */
export type RouterExtension<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = (context: RouterExtensionContext<State, Action, Options>) => Partial<Router<State, Action>>;

/**
 * Creates a router factory that merges the members returned by `extension` over the router
 * created by `base`. The effective `normalizeState` (from the extension, else from the base
 * router) runs on every state the resulting router returns.
 *
 * Annotate the extension's context or return type to change the state, action, or options types.
 *
 * @example
 * ```ts
 * const Router = extendRouter(StackRouter, ({ baseRouter }) => ({
 *   getStateForRouteFocus: (state, key) => { ... },
 * }));
 * ```
 */
export function extendRouter<
  BaseState extends NavigationState,
  BaseAction extends NavigationAction,
  BaseOptions extends DefaultRouterOptions,
  State extends NavigationState = BaseState,
  Action extends NavigationAction = BaseAction,
  Options extends BaseOptions = BaseOptions,
>(
  base: RouterFactory<BaseState, BaseAction, BaseOptions>,
  extension: RouterExtension<State, Action, Options>
): RouterFactory<State, Action, Options> {
  return (options) => {
    // The extension owns the state and action types of the router it produces. The base router
    // is created for the base types and the extension decides which of its members still apply.
    const baseRouter = base(options) as unknown as Router<State, Action>;
    const router: Router<State, Action> = {
      ...baseRouter,
      ...extension({ baseRouter, options, createRouteKeyMinter }),
    };
    const { normalizeState } = router;

    if (!normalizeState) {
      return router;
    }

    return {
      ...router,
      getStateForDeclaredRoutes: (state, routeNames) =>
        normalizeState(router.getStateForDeclaredRoutes(state, routeNames)),
      getStateForRouteFocus: (state, key) =>
        normalizeState(router.getStateForRouteFocus(state, key)),
      getStateForAction: (state, action, config) => {
        const result = router.getStateForAction(state, action, config);

        if (result === null) {
          return null;
        }

        const normalizedState = normalizeState(result.state);
        return normalizedState === result.state ? result : { ...result, state: normalizedState };
      },
    };
  };
}

export type RouterActionContext<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = RouterConfigOptions & {
  /**
   * The router being extended. Call its `getStateForAction` to delegate an action or to
   * post-process the base result. Actions it does not recognize return `null`.
   */
  baseRouter: Router<State, Action>;
  /**
   * The options the navigator passed to the router factory.
   */
  options: Options;
  /**
   * Mints the next route key for the state being reduced. `routeKeySeq` is tracked for you and
   * stamped onto the returned state.
   */
  nextKey(name: string): string;
};

/**
 * Reduces one action. Return a result to handle the action, `null` to reject it, or `undefined`
 * to let the base router handle it.
 */
export type RouterActionReducer<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = (
  state: State,
  action: Action,
  context: RouterActionContext<State, Action, Options>
) => RouterActionResult<State> | null | undefined;

/**
 * Creates a router factory whose `getStateForAction` runs `reducer` before the base router.
 * Every other router member, including `shouldActionChangeFocus`, is inherited; use
 * `extendRouter` to change those.
 *
 * Annotate the reducer's `action` or `context` parameter to add action types or widen the
 * router options.
 *
 * @example
 * ```ts
 * const Router = extendRouterActions(StackRouter, (state, action: StackAction | ClearAction, { nextKey }) => {
 *   if (action.type !== 'CLEAR') {
 *     return undefined;
 *   }
 *   const route = { key: nextKey('index'), name: 'index' };
 *   return { state: { ...state, index: 0, routes: [route] }, affectedRouteKey: route.key };
 * });
 * ```
 */
export function extendRouterActions<
  State extends NavigationState,
  BaseAction extends NavigationAction,
  BaseOptions extends DefaultRouterOptions,
  Action extends NavigationAction = BaseAction,
  Options extends BaseOptions = BaseOptions,
>(
  base: RouterFactory<State, BaseAction, BaseOptions>,
  reducer: RouterActionReducer<State, Action, Options>
): RouterFactory<State, Action, Options> {
  return extendRouter<State, BaseAction, BaseOptions, State, Action, Options>(
    base,
    ({ baseRouter, options }) => {
      // `Router` requires `type` conditionally on `State`, which TypeScript cannot resolve for a
      // generic `State`; the override never sets `type`, so the shape is compatible.
      const overrides = {
        getStateForAction(state: State, action: Action, config: RouterConfigOptions) {
          // One counter shared by `nextKey` and delegation, so keys minted on either side never
          // collide regardless of the order the reducer uses them in.
          let routeKeySeq = state.routeKeySeq;
          const delegate: Router<State, Action> = {
            ...baseRouter,
            getStateForAction(delegateState, delegateAction, delegateConfig) {
              const result = baseRouter.getStateForAction(
                delegateState.routeKeySeq < routeKeySeq
                  ? { ...delegateState, routeKeySeq }
                  : delegateState,
                delegateAction,
                delegateConfig
              );
              if (result !== null) {
                routeKeySeq = Math.max(routeKeySeq, result.state.routeKeySeq);
              }
              return result;
            },
          };
          const context: RouterActionContext<State, Action, Options> = {
            ...config,
            baseRouter: delegate,
            options,
            nextKey(name) {
              const minter = createRouteKeyMinter({
                key: state.key,
                routeKeySeq,
              });
              const key = minter.mint(name);
              routeKeySeq = minter.routeKeySeq;
              return key;
            },
          };

          let result = reducer(state, action, context);
          if (result === undefined) {
            result = delegate.getStateForAction(state, action, config);
          }
          if (result === null) {
            return null;
          }

          return result.state.routeKeySeq < routeKeySeq
            ? { ...result, state: { ...result.state, routeKeySeq } }
            : result;
        },
      } as Partial<Router<State, Action>>;
      return overrides;
    }
  );
}
