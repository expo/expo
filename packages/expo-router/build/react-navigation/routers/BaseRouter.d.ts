import type { CommonNavigationAction, NavigationState, PartialState } from './types';
/**
 * Base router object that can be used when writing custom routers.
 * This provides few helper methods to handle common actions such as `RESET`.
 */
export declare const BaseRouter: {
    getStateForAction<State extends NavigationState>(state: State, action: CommonNavigationAction): State | PartialState<State> | null;
    shouldActionChangeFocus(action: CommonNavigationAction): action is {
        type: "NAVIGATE";
        payload: {
            name: string;
            params?: object;
            path?: string;
            merge?: boolean;
            pop?: boolean;
        };
        source?: string;
        target?: string;
    } | {
        type: "NAVIGATE_DEPRECATED";
        payload: {
            name: string;
            params?: object;
            merge?: boolean;
        };
        source?: string;
        target?: string;
    };
};
//# sourceMappingURL=BaseRouter.d.ts.map