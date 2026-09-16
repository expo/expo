import { ensureStateType } from './ensureStateType';
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
  baseRouter: Router<State, Action> & {
    /**
     * `config` defaults to the config of the action being reduced.
     */
    getStateForAction(
      state: State,
      action: Action,
      config?: RouterConfigOptions
    ): RouterActionResult<State> | null;
  };
  /**
   * The options the navigator passed to the router factory.
   */
  options: Options;
  /**
   * Mints the next route key for the state being reduced or focused. `routeKeySeq` is tracked for
   * you and stamped onto the returned state.
   */
  nextKey(name: string): string;
};

export type RouterExtensionOptions<State extends NavigationState> = {
  /**
   * The router's `type`, also stamped onto the states it focuses or reduces. Defaults to the base
   * router's type.
   */
  type?: NonNullable<State['type']>;
};

/**
 * Returns the router members to merge over the base router. Members that are left out are
 * inherited from the base router, including `actionCreators`: return a merged object to add
 * action creators instead of replacing them. An inherited `normalizeState` runs on the extended
 * state type, so an extension that changes the state type returns its own unless the base's fits.
 */
export type RouterExtension<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = (context: RouterExtensionContext<State, Action, Options>) => Partial<Router<State, Action>>;

/**
 * Creates a router factory that merges the members returned by `extension` over the router
 * created by `base`.
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
  extension: RouterExtension<State, Action, Options>,
  { type: extendedType }: RouterExtensionOptions<State> = {}
  // Not `RouterFactory`: TypeScript compares two instantiations of that alias by measured variance,
  // and `Router`'s conditional `type` requirement makes `State` measure as invariant. `typeof
  // StackRouter` then fails constraints such as `RouterFactory<NavigationState, NavigationAction,
  // DefaultRouterOptions>` (TS2344 in `views/Navigator.tsx`). A function type is compared structurally.
): (options: Options) => Router<State, Action> {
  return (options) => {
    // The extension owns the state and action types of the router it produces. The base router
    // is created for the base types and the extension decides which of its members still apply.
    const baseRouter = base(options) as unknown as Router<State, Action>;
    const type = extendedType ?? baseRouter.type;
    const ensureType = (state: State) =>
      type === undefined ? state : ensureStateType(state, type);

    // The call in progress. One counter is shared by `nextKey` and delegation to the base router,
    // so keys minted on either side never collide regardless of the order they are used in.
    let current: { key: string; routeKeySeq: number; config?: RouterConfigOptions } = {
      key: '',
      routeKeySeq: 0,
    };
    const start = (state: State, config?: RouterConfigOptions) => {
      current = { key: state.key, routeKeySeq: state.routeKeySeq, config };
      return state;
    };
    const stamp = (state: State): State =>
      state.routeKeySeq < current.routeKeySeq
        ? { ...state, routeKeySeq: current.routeKeySeq }
        : state;
    // Every returned state gets the shared sequence, the type of the state it was derived from
    // (an outer router in the chain may have stamped it before delegating), and the effective
    // `normalizeState` (the extension's, else the base router's). States routed through
    // `context.baseRouter` were already normalized by the base router.
    const finish = (state: State, stateType: State['type']) => {
      const stamped = stamp(state);
      const typed = stateType === undefined ? stamped : ensureStateType(stamped, stateType);
      return normalizeState ? normalizeState(typed) : typed;
    };

    const delegate: RouterExtensionContext<State, Action, Options>['baseRouter'] = {
      ...baseRouter,
      getStateForAction(state, action, config = current.config) {
        if (config === undefined) {
          throw new Error(
            '`baseRouter.getStateForAction` needs the `config` argument when it is called outside of `getStateForAction`, because only that method receives one from the navigator. Pass the config explicitly.'
          );
        }
        const result = baseRouter.getStateForAction(stamp(state), action, config);
        if (result !== null) {
          current.routeKeySeq = Math.max(current.routeKeySeq, result.state.routeKeySeq);
        }
        return result;
      },
    };
    const nextKey = (name: string) => {
      const minter = createRouteKeyMinter(current);
      const key = minter.mint(name);
      current.routeKeySeq = minter.routeKeySeq;
      return key;
    };

    const router: Router<State, Action> = {
      ...baseRouter,
      ...extension({ baseRouter: delegate, options, nextKey }),
      type,
    };
    const { normalizeState } = router;

    return {
      ...router,
      getStateForDeclaredRoutes(state, routeNames) {
        // Render-phase fallback: the seeded state keeps its own `type` until an action stamps it.
        return finish(router.getStateForDeclaredRoutes(start(state), routeNames), state.type);
      },
      getStateForRouteFocus(state, key) {
        const typedState = ensureType(start(state));
        return finish(router.getStateForRouteFocus(typedState, key), typedState.type);
      },
      getStateForAction(state, action, config) {
        const typedState = ensureType(start(state, config));
        const result = router.getStateForAction(typedState, action, config);

        if (result === null) {
          return null;
        }

        const finishedState = finish(result.state, typedState.type);
        return finishedState === result.state ? result : { ...result, state: finishedState };
      },
    };
  };
}

export type RouterActionContext<
  State extends NavigationState,
  Action extends NavigationAction,
  Options extends DefaultRouterOptions,
> = RouterConfigOptions &
  Pick<RouterExtensionContext<State, Action, Options>, 'baseRouter' | 'options' | 'nextKey'>;

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
): (options: Options) => Router<State, Action> {
  return extendRouter<State, BaseAction, BaseOptions, State, Action, Options>(
    base,
    ({ baseRouter, options, nextKey }) => {
      // `Router` requires `type` conditionally on `State`, which TypeScript cannot resolve for a
      // generic `State`; the override never sets `type`, so the shape is compatible.
      const overrides = {
        getStateForAction(state: State, action: Action, config: RouterConfigOptions) {
          const result = reducer(state, action, { ...config, baseRouter, options, nextKey });
          return result === undefined
            ? baseRouter.getStateForAction(state, action, config)
            : result;
        },
      } as Partial<Router<State, Action>>;
      return overrides;
    }
  );
}
