import type { NavigationAction, NavigationState, Router } from '../routers';
type Options<State extends NavigationState, Action extends NavigationAction> = {
    router: Router<State, Action>;
    getState: () => State;
    setState: (state: State) => void;
    key?: string;
};
/**
 * Hook to handle focus actions for a route.
 * Focus action needs to be treated specially, coz when a nested route is focused,
 * the parent navigators also needs to be focused.
 */
export declare function useOnRouteFocus<State extends NavigationState, Action extends NavigationAction>({ router, getState, key: sourceRouteKey, setState, }: Options<State, Action>): (key: string) => void;
export {};
//# sourceMappingURL=useOnRouteFocus.d.ts.map