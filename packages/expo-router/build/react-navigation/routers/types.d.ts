import type * as CommonActions from './CommonActions';
export type CommonNavigationAction = CommonActions.Action;
export type NavigationRoute<ParamList extends ParamListBase, RouteName extends keyof ParamList> = Route<Extract<RouteName, string>, ParamList[RouteName]> & {
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
export type InitialState = Readonly<Partial<Omit<NavigationState, 'stale' | 'routes'>> & {
    routes: (Omit<Route<string>, 'key'> & {
        state?: InitialState;
    })[];
}>;
export type PartialRoute<R extends Route<string>> = Omit<R, 'key'> & {
    key?: string;
    state?: PartialState<NavigationState>;
};
export type PartialState<State extends NavigationState> = Partial<Omit<State, 'stale' | 'routes'>> & Readonly<{
    stale?: true;
    routes: PartialRoute<Route<State['routeNames'][number]>>[];
}>;
export type Route<RouteName extends string, Params extends object | undefined = object | undefined> = Readonly<{
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
}> & (undefined extends Params ? Readonly<{
    /**
     * Params for this route
     */
    params?: Readonly<Params>;
}> : Readonly<{
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
export type RouterFactory<State extends NavigationState, Action extends NavigationAction, RouterOptions extends DefaultRouterOptions> = (options: RouterOptions) => Router<State, Action>;
export type RouterConfigOptions = {
    routeNames: string[];
    routeParamList: ParamListBase;
    routeGetIdList: Record<string, ((options: {
        params?: Record<string, any>;
    }) => string | undefined) | undefined>;
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
    getRehydratedState(partialState: PartialState<State> | State, options: RouterConfigOptions): State;
    /**
     * Take the current state and updated list of route names, and return a new state.
     *
     * @param state State object to update.
     * @param options.routeNames New list of route names.
     * @param options.routeParamsList Object containing params for each route.
     */
    getStateForRouteNamesChange(state: State, options: RouterConfigOptions & {
        /**
         * List of routes whose key has changed even if they still have the same name.
         * This allows to remove screens declaratively.
         */
        routeKeyChanges: string[];
    }): State;
    /**
     * Take the current state and key of a route, and return a new state with the route focused
     *
     * @param state State object to apply the action on.
     * @param key Key of the route to focus.
     */
    getStateForRouteFocus(state: State, key: string): State;
    /**
     * Take the current state and action, and return a new state.
     * If the action cannot be handled, return `null`.
     *
     * @param state State object to apply the action on.
     * @param action Action object to apply.
     * @param options.routeNames List of valid route names as defined in the screen components.
     * @param options.routeParamsList Object containing params for each route.
     */
    getStateForAction(state: State, action: Action, options: RouterConfigOptions): State | PartialState<State> | null;
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
//# sourceMappingURL=types.d.ts.map