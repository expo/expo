import * as React from 'react';
import type { NavigationState, ParamListBase, PartialState, Route } from '../routers';
import type { NavigationProp, RouteConfigComponent } from './types';
type Props<State extends NavigationState, ScreenOptions extends object> = {
    screen: RouteConfigComponent<ParamListBase, string> & {
        name: string;
    };
    navigation: NavigationProp<ParamListBase, string, string | undefined, State, ScreenOptions>;
    route: Route<string>;
    routeState: NavigationState | PartialState<NavigationState> | undefined;
    getState: () => State;
    setState: (state: State) => void;
    options: object;
    clearOptions: () => void;
};
/**
 * Component which takes care of rendering the screen for a route.
 * It provides all required contexts and applies optimizations when applicable.
 */
export declare function SceneView<State extends NavigationState, ScreenOptions extends object>({ screen, route, navigation, routeState, getState, setState, options, clearOptions, }: Props<State, ScreenOptions>): React.JSX.Element;
export {};
//# sourceMappingURL=SceneView.d.ts.map