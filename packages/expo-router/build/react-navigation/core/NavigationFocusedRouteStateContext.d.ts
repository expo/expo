import * as React from 'react';
export type FocusedRouteState = {
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
 * Context for the parent route of a navigator.
 */
export declare const NavigationFocusedRouteStateContext: React.Context<FocusedRouteState | undefined>;
//# sourceMappingURL=NavigationFocusedRouteStateContext.d.ts.map