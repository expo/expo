import type { ResultState } from '../fork/getStateFromPath';
import type { PartialRoute, NavigationState, PartialState } from '../react-navigation/native';
/**
 * React Navigation uses params to store information about the screens, rather then create new state for each level.
 * This function traverses the action state that will not be part of state and returns a payload that can be used in action.
 */
export declare function getPayloadFromStateRoute(_actionStateRoute: PartialRoute<any>): Record<string, any>;
/**
 * Traverse the state tree comparing the current state and the action state until we find where they diverge.
 *
 * @returns An object with:
 *  - `actionState` — the remaining action state at the point of divergence
 *  - `navigationState` — the navigator that should be targeted for the dispatched action
 *  - `actionStateRoute` — the specific route in the action state where divergence was detected
 *  - `navigationRoutes` — navigation routes that matched before divergence (used for tab targeting)
 *
 * @private
 */
export declare function findDivergentState(_actionState: ResultState, _navigationState: NavigationState, lookThroughAllTabs?: boolean): {
    actionState: PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation/core").NavigationRoute<import("../react-navigation/core").ParamListBase, string>[];
        type: string;
        stale: false;
    }>>;
    navigationState: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation/core").NavigationRoute<import("../react-navigation/core").ParamListBase, string>[];
        type: string;
        stale: false;
    }>;
    actionStateRoute: PartialRoute<any> | undefined;
    navigationRoutes: import("../react-navigation/core").NavigationRoute<import("../react-navigation/core").ParamListBase, string>[];
};
//# sourceMappingURL=stateUtils.d.ts.map