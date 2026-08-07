import type * as CommonActions from './CommonActions';

export type CommonNavigationAction =
  | CommonActions.Action
  | CommonActions.InternalRouteNamesChangedAction
  | CommonActions.InternalNavigatorParamsChangedAction;

export type NavigationRoute<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
> = Route<Extract<RouteName, string>, ParamList[RouteName]> & {
  state?: NavigationState | PartialState<NavigationState>;
};

export type NavigationState<ParamList extends ParamListBase = ParamListBase> = Readonly<{
  /**
   * Unique key for the navigation state.
   */
  key: string;
  /**
   * Index of the currently focused route.
   */
  index: number;
  /**
   * List of valid route names as defined in the screen components.
   */
  routeNames: Extract<keyof ParamList, string>[];
  /**
   * Alternative entries for history.
   */
  history?: unknown[];
  /**
   * List of rendered routes.
   */
  routes: NavigationRoute<ParamList, keyof ParamList>[];
  /**
   * Custom type for the state, whether it's for tab, stack, drawer etc.
   * During rehydration, the state will be discarded if type doesn't match with router type.
   * It can also be used to detect the type of the navigator we're dealing with.
   */
  type: string;
  /**
   * Whether the navigation state has been rehydrated.
   */
  stale: false;
}>;

export type InitialState = Readonly<
  Partial<Omit<NavigationState, 'stale' | 'routes'>> & {
    routes: (Omit<Route<string>, 'key'> & { state?: InitialState })[];
  }
>;

export type PartialRoute<R extends Route<string>> = Omit<R, 'key'> & {
  key?: string;
  state?: NavigationState | PartialState<NavigationState>;
};

export type PartialState<State extends NavigationState> = Partial<Omit<State, 'stale' | 'routes'>> &
  Readonly<{
    stale?: true;
    routes: PartialRoute<Route<State['routeNames'][number]>>[];
  }>;

export type KeyedPartialRoute<R extends Route<string>> = Omit<PartialRoute<R>, 'key' | 'state'> & {
  key: string;
  state?: KeyedPartialState<NavigationState> | NavigationState;
};

export type KeyedPartialState<State extends NavigationState> = Partial<
  Omit<State, 'key' | 'stale' | 'routes'>
> &
  Readonly<{
    key: string;
    stale?: true;
    routes: KeyedPartialRoute<Route<State['routeNames'][number]>>[];
  }>;

export type RenderRoute<R extends Route<string>> = Omit<KeyedPartialRoute<R>, 'state'> & {
  key: string;
  state?: RenderState<NavigationState>;
};

export type RenderState<State extends NavigationState> =
  | State
  | (Partial<Omit<State, 'stale' | 'routes' | 'key' | 'index' | 'routeNames' | 'type'>> &
      Readonly<{
        key: string;
        index: number;
        routeNames: State['routeNames'];
        routes: RenderRoute<Route<State['routeNames'][number]>>[];
        stale?: true;
        type: State['type'];
      }>);

export type NavigatorParamsPayload =
  | {
      state: KeyedPartialState<NavigationState> | NavigationState;
      screen?: never;
    }
  | {
      state?: never;
      screen: string;
      params?: object;
      path?: string;
      merge?: boolean;
      pop?: boolean;
      routeKey: string;
    };

export type Route<
  RouteName extends string,
  Params extends object | undefined = object | undefined,
> = Readonly<{
  /**
   * Unique key for the route.
   */
  key: string;
  /**
   * User-provided name for the route.
   */
  name: RouteName;
  /**
   * Path associated with the route.
   * Usually present when the screen was opened from a deep link.
   */
  path?: string;
}> &
  (undefined extends Params
    ? Readonly<{
        /**
         * Params for this route
         */
        params?: Readonly<Params>;
      }>
    : Readonly<{
        /**
         * Params for this route
         */
        params: Readonly<Params>;
      }>);

export type ParamListBase = Record<string, object | undefined>;

export type NavigationAction = Readonly<{
  /**
   * Type of the action (e.g. `NAVIGATE`)
   */
  type: string;
  /**
   * Additional data for the action
   */
  payload?: object;
  /**
   * Key of the route which dispatched this action.
   */
  source?: string;
  /**
   * Key of the navigator which should handle this action.
   */
  target?: string;
}>;

export type ActionCreators<Action extends NavigationAction> = {
  [key: string]: (...args: any) => Action;
};

export type DefaultRouterOptions<RouteName extends string = string> = {
  /**
   * Name of the route to focus by on initial render.
   * If not specified, usually the first route is used.
   */
  initialRouteName?: RouteName;
};

export type RouterFactory<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions,
> = (options: RouterOptions) => Router<State, Action>;

export type RouterConfigOptions = {
  routeNames: string[];
  routeParamList: ParamListBase;
  routeGetIdList: Record<
    string,
    ((options: { params?: Record<string, any> }) => string | undefined) | undefined
  >;
};

export type Router<State extends NavigationState, Action extends NavigationAction> = {
  /**
   * Type of the router. Should match the `type` property in state.
   * If the type doesn't match, the state will be discarded during rehydration.
   */
  type: State['type'];

  /**
   * Initialize the navigation state.
   *
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getInitialState(options: RouterConfigOptions): State;

  /**
   * Rehydrate the full navigation state from a given partial state.
   *
   * @param partialState Navigation state to rehydrate from.
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getRehydratedState(
    partialState: PartialState<State> | KeyedPartialState<State> | State,
    options: RouterConfigOptions
  ): State;

  /**
   * Project state to the route names currently declared by the navigator for rendering until
   * `ROUTE_NAMES_CHANGED` has been reconciled.
   *
   * This is a render-phase fallback, not a state change. It filters undeclared active and
   * preloaded routes, keeps a definite index, and may add a route with `fallbackRouteKey` when no
   * declared route survives. Return `state` unchanged when no projection is needed.
   *
   * @param state State object to filter.
   * @param routeNames Route names currently declared by the navigator.
   */
  getStateForDeclaredRoutes<InputState extends State | KeyedPartialState<State>>(
    state: InputState,
    routeNames: string[],
    fallbackRouteKey?: string
  ): InputState;

  /**
   * Project nested navigator params without rehydrating or creating keys. Custom routers which
   * override navigation semantics must override this method as well.
   */
  getStateForNavigatorParams?(
    state: State | KeyedPartialState<State>,
    params: NavigatorParamsPayload,
    options: RouterConfigOptions
  ): State | KeyedPartialState<State> | null;

  /**
   * Take the current state and key of a route, and return a new state with the route focused
   *
   * @param state State object to apply the action on.
   * @param key Key of the route to focus.
   */
  getStateForRouteFocus(state: State, key: string): State;

  /**
   * Take the current state and action, and return a new state.
   * If the action cannot be handled, return `null`. Custom routers must explicitly handle
   * `ROUTE_NAMES_CHANGED` and `NAVIGATOR_PARAMS_CHANGED` to durably reconcile state using their
   * effective router methods.
   *
   * @param state State object to apply the action on.
   * @param action Action object to apply.
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getStateForAction(
    state: State,
    action: Action,
    options: RouterConfigOptions
  ): State | PartialState<State> | null;

  /**
   * Whether the action should also change focus in parent navigator
   *
   * @param action Action object to check.
   */
  shouldActionChangeFocus(action: NavigationAction): boolean;

  /**
   * Action creators for the router.
   */
  actionCreators?: ActionCreators<Action>;
};
