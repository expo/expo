import type { ComponentType, RefObject } from 'react';
import type { EventMapBase, NavigationProp, ParamListBase, RouteProp, ScreenListeners, NavigationState } from '../react-navigation/native';
import type { NativeStackNavigationEventMap } from '../react-navigation/native-stack';
type AnyNavigatorFactory = (config?: any) => {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
    Group: ComponentType<any>;
};
type ScreenListenersInput<TState extends NavigationState, TEventMap extends EventMapBase> = ScreenListeners<TState, TEventMap> | ((props: {
    route: RouteProp<ParamListBase, string>;
    navigation: ScreenNavigation;
}) => ScreenListeners<TState, TEventMap>);
type ScreenNavigation = NavigationProp<ParamListBase>;
type ObservedScreenListeners = ScreenListeners<NavigationState, Pick<NativeStackNavigationEventMap, 'transitionStart' | 'transitionEnd'>>;
type StackListenerMap = Required<Pick<ObservedScreenListeners, 'transitionStart' | 'transitionEnd'>>;
type TabListenerMap = Required<Pick<ObservedScreenListeners, 'focus' | 'blur'>>;
type FocusedRouteState = {
    routes: [
        {
            key?: string;
            name: string;
            params?: object;
            path?: string;
            state?: FocusedRouteState;
        }
    ];
};
/**
 * Append a route to the innermost level of `parent`. Mirrors how
 * SceneView builds the focused-route state when entering a child navigator.
 *
 * If the appended route's params describe a nested navigation in React
 * Navigation's `{ screen, params }` shape, expand them recursively into nested
 * `state` so `getPathFromState` can resolve the full focused path even when the
 * route does not yet expose a resolved nested state.
 *
 * @internal Exposed for unit testing only.
 */
export declare function appendRouteToFocusedState(parent: FocusedRouteState | undefined, route: RouteProp<ParamListBase, string>): FocusedRouteState;
/**
 * @internal Exposed for unit testing only.
 */
export declare function mergeListeners(theirs: ScreenListenersInput<NavigationState, EventMapBase> | undefined, ours: ObservedScreenListeners): ({ route, navigation, }: {
    route: RouteProp<ParamListBase, string>;
    navigation: ScreenNavigation;
}) => ObservedScreenListeners;
/**
 * @internal Exposed for unit testing only.
 */
export declare function buildStackListeners(parentStateForPathRef: RefObject<FocusedRouteState | undefined>, route: RouteProp<ParamListBase, string>): StackListenerMap;
/**
 * @internal Exposed for unit testing only.
 */
export declare function buildTabListeners(parentStateForPathRef: RefObject<FocusedRouteState | undefined>, route: RouteProp<ParamListBase, string>): TabListenerMap;
/**
 * @internal Exposed for unit testing only.
 */
export declare function buildScreenListeners(mode: 'stack' | 'tab', parentStateForPathRef: RefObject<FocusedRouteState | undefined>, userScreenListeners: ScreenListenersInput<NavigationState, EventMapBase> | undefined): ({ route, navigation, }: {
    route: RouteProp<ParamListBase, string>;
    navigation: ScreenNavigation;
}) => ObservedScreenListeners;
/**
 * Wraps a stack-style React Navigation factory so every screen rendered by it
 * emits `pageWillAppear`/`pageAppeared`/`pageWillDisappear`/`pageDisappeared`
 * via `unstable_navigationEvents` based on `transitionStart`/`transitionEnd`.
 */
export declare const withNavigationEvents: <F extends AnyNavigatorFactory>(create: F) => F;
/**
 * Wraps a tab/drawer React Navigation factory so every screen emits only
 * `pageAppeared` (on focus) and `pageDisappeared` (on blur).
 */
export declare const withTabNavigationEvents: <F extends AnyNavigatorFactory>(create: F) => F;
export {};
//# sourceMappingURL=withNavigationEvents.d.ts.map