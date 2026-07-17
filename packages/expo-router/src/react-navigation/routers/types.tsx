import type * as CommonActions from './CommonActions';

export type CommonNavigationAction = CommonActions.Action;

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
   * List of rendered routes.
   */
  routes: NavigationRoute<ParamList, keyof ParamList>[];
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
  state?: PartialState<NavigationState>;
};

export type PartialState<State extends NavigationState> = Partial<Omit<State, 'stale' | 'routes'>> &
  Readonly<{
    stale?: true;
    routes: PartialRoute<Route<State['routeNames'][number]>>[];
  }>;

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
  /**
   * The key of the route this navigator renders under (its parent route key). The navigator derives
   * its own state key from it via `getStateKey`, and all its route keys from that. `useNavigationBuilder`
   * supplies it to every router; `undefined` at the root container, which yields the `navigator` sentinel.
   */
  parentRouteKey: string | undefined;
  routeParamList: ParamListBase;
  routeGetIdList: Record<
    string,
    ((options: { params?: Record<string, any> }) => string | undefined) | undefined
  >;
};

export type Router<State extends NavigationState, Action extends NavigationAction> = {
  /**
   * Take the current state and action, and return a new state.
   * If the action cannot be handled, return `null`.
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
   * Action creators for the router.
   */
  actionCreators?: ActionCreators<Action>;
};

export type InternalRouter<State extends NavigationState, Action extends NavigationAction> = Router<
  State,
  Action
> & {
  /**
   * Initialize the navigation state.
   */
  getInitialState: (options: RouterConfigOptions) => State;
};
