import { InitialState, NavigationState, ParamListBase, PartialState, getActionFromState } from '@react-navigation/native';
import { ResultState } from '../fork/getStateFromPath';
export type NavigateAction = Extract<ReturnType<typeof getActionFromState>, {
    type: 'NAVIGATE';
}> & {
    payload: NavigateActionParams;
};
export type NavigateActionParams = {
    params?: NavigateActionParams;
    path: string;
    initial: boolean;
    screen: string;
    name?: string;
};
/** Return the absolute last route to move to. */
export declare function findTopRouteForTarget(state: ResultState): Omit<import("@react-navigation/native").Route<string, object | undefined>, "key"> & {
    state?: Readonly<Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & {
        routes: (Omit<import("@react-navigation/native").Route<string, object | undefined>, "key"> & any)[];
    }> | undefined;
};
/** @returns true if moving to a sibling inside the same navigator. */
export declare function isMovingToSiblingRoute(currentState: NavigationState | PartialState<NavigationState> | undefined, targetState: ResultState | undefined): boolean;
export declare function getQualifiedStateForTopOfTargetState(rootState: InitialState, targetState: ResultState): Readonly<Partial<Omit<Readonly<{
    key: string;
    index: number;
    routeNames: string[];
    history?: unknown[] | undefined;
    routes: (Readonly<{
        key: string;
        name: string;
        path?: string | undefined;
    }> & Readonly<{
        params?: Readonly<object | undefined>;
    }> & {
        state?: Readonly<any> | PartialState<Readonly<any>> | undefined;
    })[];
    type: string;
    stale: false;
}>, "stale" | "routes">> & {
    routes: (Omit<import("@react-navigation/native").Route<string, object | undefined>, "key"> & {
        state?: Readonly<Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & any> | undefined;
    })[];
}>;
export declare function getEarliestMismatchedRoute<T extends ParamListBase>(rootState: NavigationState<T> | undefined, actionParams: NavigateActionParams): {
    name: string;
    params?: any;
    type?: string;
} | null;
//# sourceMappingURL=stateOperations.d.ts.map